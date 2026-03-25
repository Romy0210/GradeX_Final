from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import joblib
import pandas as pd
import numpy as np
import shap
import json
import os

app = FastAPI(title="GradeX ML Prediction API", description="AI prediction engine for student academic risk.")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:9002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
MODEL_PATH = "risk_model.pkl"
ENCODER_PATH = "label_encoder.pkl"

try:
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    with open("feature_names.json", "r") as f:
        feature_names = json.load(f)
        
    # Initialize SHAP explainer
    explainer = shap.TreeExplainer(model)
    print("✅ Models and SHAP Explainer loaded successfully.")
    print(f"✅ Model features: {feature_names}")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    model = None
    encoder = None
    explainer = None
    feature_names = None


# Input Schema Model
class StudentFeatures(BaseModel):
    gpa: float = Field(..., description="GPA out of 10")
    attendancePercentage: float = Field(..., description="Attendance Percentage (%)")
    assignmentCompletionPercentage: float = Field(..., description="Overall Assignment Completion Percentage (%)")
    pendingAssignments: int = Field(..., description="Total Number of Pending Assignments")
    overallAverageMarkPercentage: float = Field(..., description="Overall Average Mark Percentage (fallback if no subjects)")
    # New: per-subject internal mark signals (optional for backward compat.)
    avgInternalMarkPercentage: Optional[float] = Field(None, description="Average of (internalMark1+internalMark2)/80*100 across all subjects")
    failingSubjectCount: Optional[int] = Field(None, description="Number of subjects where average internal marks < 40%")
    lowestSubjectMarkPercentage: Optional[float] = Field(None, description="Lowest subject average mark percentage among all subjects")


# Prediction Logic Helper
def assign_grade(gpa, avg_mark, risk_level):
    if avg_mark >= 90: base_grade = 'S'
    elif avg_mark >= 85: base_grade = 'A+'
    elif avg_mark >= 80: base_grade = 'A'
    elif avg_mark >= 75: base_grade = 'B+'
    elif avg_mark >= 70: base_grade = 'B'
    elif avg_mark >= 65: base_grade = 'C+'
    elif avg_mark >= 60: base_grade = 'C'
    elif avg_mark >= 55: base_grade = 'D'
    else: base_grade = 'F'

    grades_order = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+', 'S']
    
    try:
        grade_index = grades_order.index(base_grade)
    except ValueError:
        grade_index = 0

    if gpa < 6.5: grade_index -= 2
    elif 6.5 <= gpa < 7.5: grade_index -= 1
    elif gpa >= 8.5: grade_index += 1
    
    if risk_level == "High": 
        return "F"
    else:
        if risk_level == "Medium": grade_index -= 1
        grade_index = max(0, min(len(grades_order) - 1, grade_index))
        return grades_order[grade_index]


@app.post("/predict")
@app.post("/predict-student-analysis")
async def predict_risk(student: StudentFeatures):
    if not model or not encoder:
        raise HTTPException(status_code=500, detail="Machine Learning model is not loaded on the server.")
        
    try:
        # Use real internal marks if provided, otherwise fall back to overallAverageMarkPercentage
        avg_internal = student.avgInternalMarkPercentage \
            if student.avgInternalMarkPercentage is not None \
            else student.overallAverageMarkPercentage

        failing_count = student.failingSubjectCount \
            if student.failingSubjectCount is not None \
            else (1 if avg_internal < 40 else 0)

        lowest_mark = student.lowestSubjectMarkPercentage \
            if student.lowestSubjectMarkPercentage is not None \
            else avg_internal

        # Engineering features (same as training)
        assignment_ratio = student.assignmentCompletionPercentage / 100.0
        # Composite Score: Marks (70%) + Assignment (12%) + GPA (10%) + Attendance (8%)
        composite_score = (
            (avg_internal * 0.70) + 
            (student.assignmentCompletionPercentage * 0.12) + 
            (student.gpa * 10 * 0.10) + 
            (student.attendancePercentage * 0.08)
        )
        has_failing_subject = 1 if failing_count > 0 else 0
        
        # Build input aligned to training feature order
        input_data = {
            'gpa': [student.gpa],
            'attendancePercentage': [student.attendancePercentage],
            'assignmentCompletionPercentage': [student.assignmentCompletionPercentage],
            'pendingAssignments': [student.pendingAssignments],
            'overallAverageMarkPercentage': [student.overallAverageMarkPercentage],
            'avgInternalMarkPercentage': [avg_internal],
            'failingSubjectCount': [failing_count],
            'lowestSubjectMarkPercentage': [lowest_mark],
            'assignment_ratio': [assignment_ratio],
            'composite_score': [composite_score],
            'has_failing_subject': [has_failing_subject],
        }
        
        df_input = pd.DataFrame(input_data)
        df_input = df_input[feature_names]  # Reorder to match training
        
        # Predict class and probability
        import time
        start_time = time.time()
        prediction = model.predict(df_input)
        probabilities = model.predict_proba(df_input)[0]
        pred_time = time.time() - start_time
        print(f"⏱️ Model Prediction: {pred_time:.4f}s")
        
        predicted_class_idx = prediction[0]
        risk_level = encoder.inverse_transform([predicted_class_idx])[0]
        confidence = float(np.max(probabilities) * 100)
        
        # Hard override: if any subject is failing, MUST be High risk
        if failing_count > 0 and risk_level != "High":
            print(f"⚠️  Override: failingSubjectCount={failing_count}, forcing High risk (was {risk_level})")
            risk_level = "High"
        
        # Derive outcome and grade
        outcome = "Fail" if risk_level == "High" else "Pass"
        grade_mark = avg_internal  # use real internal mark for grade
        grade = assign_grade(student.gpa, grade_mark, risk_level)
        
        # --- Explainable AI (SHAP) ---
        top_factors = []
        try:
            if explainer:
                shap_start = time.time()
                # Fast path for tree models
                shap_values = explainer.shap_values(df_input, check_additivity=False)
                shap_time = time.time() - shap_start
                print(f"⏱️ SHAP Explanation: {shap_time:.4f}s")
                class_shap_values = shap_values[predicted_class_idx][0]
                
                feature_impacts = list(zip(feature_names, class_shap_values))
                feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
                
                for feat_name, impact in feature_impacts[:4]:  # Top 4 factors
                    val = input_data[feat_name][0]
                    
                    if risk_level == "High":
                        if feat_name == "failingSubjectCount" and val >= 1:
                            top_factors.append(f"Failing {int(val)} subject(s) with marks below 40%")
                        elif feat_name == "lowestSubjectMarkPercentage" and val < 40:
                            top_factors.append(f"Lowest subject mark is only {val:.1f}%")
                        elif feat_name == "avgInternalMarkPercentage" and val < 50:
                            top_factors.append(f"Low average internal marks ({val:.1f}%)")
                        elif feat_name == "attendancePercentage" and val < 80:
                            top_factors.append(f"Low attendance ({val:.1f}%)")
                        elif feat_name == "gpa" and val < 6.5:
                            top_factors.append(f"Low GPA ({val})")
                        elif feat_name == "pendingAssignments" and val >= 3:
                            top_factors.append(f"High pending assignments ({int(val)})")
                    elif risk_level == "Low":
                        if feat_name == "avgInternalMarkPercentage" and val >= 70:
                            top_factors.append(f"Strong internal marks ({val:.1f}%)")
                        elif feat_name == "attendancePercentage" and val >= 90:
                            top_factors.append(f"Strong attendance ({val:.1f}%)")
                        elif feat_name == "gpa" and val > 8.0:
                            top_factors.append(f"Strong GPA ({val})")
                        elif feat_name == "pendingAssignments" and val == 0:
                            top_factors.append("No pending assignments")
                    else:
                        if feat_name in ["avgInternalMarkPercentage", "composite_score", "gpa"]:
                            label_map = {
                                "avgInternalMarkPercentage": "Average internal marks",
                                "composite_score": "Composite score",
                                "gpa": "GPA"
                            }
                            top_factors.append(f"{label_map.get(feat_name, feat_name)} ({val:.1f}) is a contributing factor.")

                top_factors = list(dict.fromkeys(top_factors))  # deduplicate preserving order
                if len(top_factors) == 0:
                    top_factors.append("Borderline metrics contributing to risk assessment.")
        except Exception as e:
            print(f"SHAP explanation failed: {e}")
            top_factors = ["Feature explanation unavailable."]

        return {
            "riskLevel": risk_level,
            "outcome": outcome,
            "gradeCategory": grade,
            "probability": round(confidence, 1),
            "topFactors": top_factors
        }
        
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None, "features": feature_names}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
