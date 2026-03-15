from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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
    allow_origins=["http://localhost:3000", "http://localhost:9002"], # Added 9002 based on user's dev server port
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
    overallAverageMarkPercentage: float = Field(..., description="Overall Average Mark Percentage")

# Prediction Logic Helper
def assign_grade(gpa, avg_mark, risk_level):
    """
    Apply grade transformation based on the same rules used during training to return a grade
    """
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
        # Engineering features
        assignment_ratio = student.assignmentCompletionPercentage / 100.0
        composite_score = (
            (student.overallAverageMarkPercentage * 0.6) + 
            (student.assignmentCompletionPercentage * 0.2) + 
            (student.attendancePercentage * 0.2)
        )
        
        # Format for pandas exactly like training
        input_data = {
            'gpa': [student.gpa],
            'attendancePercentage': [student.attendancePercentage],
            'assignmentCompletionPercentage': [student.assignmentCompletionPercentage],
            'pendingAssignments': [student.pendingAssignments],
            'overallAverageMarkPercentage': [student.overallAverageMarkPercentage],
            'assignment_ratio': [assignment_ratio],
            'composite_score': [composite_score]
        }
        
        df_input = pd.DataFrame(input_data)
        
        # Reorder to match training
        df_input = df_input[feature_names]
        
        # Predict class and probability
        prediction = model.predict(df_input)
        probabilities = model.predict_proba(df_input)[0]
        
        predicted_class_idx = prediction[0]
        risk_level = encoder.inverse_transform([predicted_class_idx])[0]
        
        # Max probability
        confidence = float(np.max(probabilities) * 100) # Percentage string
        
        # Derive Outcome and Grade Category based on predictions
        outcome = "Fail" if risk_level == "High" else "Pass"
        grade = assign_grade(student.gpa, student.overallAverageMarkPercentage, risk_level)
        
        # --- Explainable AI (SHAP) ---
        top_factors = []
        try:
            if explainer:
                shap_values = explainer.shap_values(df_input)
                # For Multi-class classification, shap_values is a list of arrays (one for each class)
                # We explain the predicted class
                class_shap_values = shap_values[predicted_class_idx][0]
                
                # Zip feature names with their SHAP impact values
                feature_impacts = list(zip(feature_names, class_shap_values))
                
                # Sort by absolute SHAP value (impact magnitude) descending
                feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
                
                # Generate human readable top factors
                for feat_name, impact in feature_impacts[:3]: # Top 3 factors
                    # Very simple natural language mapping
                    val = input_data[feat_name][0]
                    direction = "Increased" if impact > 0 else "Decreased"
                    
                    if feat_name == "gpa": name = "GPA"
                    elif feat_name == "attendancePercentage": name = "Attendance"
                    elif feat_name == "assignmentCompletionPercentage": name = "Assignment Completion"
                    elif feat_name == "pendingAssignments": name = "Pending Assignments count"
                    elif feat_name == "overallAverageMarkPercentage": name = "Average Marks"
                    elif feat_name == "composite_score": name = "Composite Scoring"
                    else: continue
                    
                    # More natural mapping:
                    if risk_level == "High":
                        if feat_name == "attendancePercentage" and val < 80: top_factors.append(f"Low attendance ({val}%)")
                        elif feat_name == "gpa" and val < 6.5: top_factors.append(f"Low GPA ({val})")
                        elif feat_name == "pendingAssignments" and val >= 3: top_factors.append(f"High pending assignments ({val})")
                        elif feat_name == "overallAverageMarkPercentage" and val < 40: top_factors.append(f"Low average marks ({val}%)")
                        elif "Overall academic performance is compounding risk." not in top_factors:
                             top_factors.append("Overall academic performance is compounding risk.")
                    elif risk_level == "Low":
                        if feat_name == "attendancePercentage" and val >= 90: top_factors.append(f"Strong attendance ({val}%)")
                        elif feat_name == "gpa" and val > 8.0: top_factors.append(f"Strong GPA ({val})")
                        elif feat_name == "pendingAssignments" and val == 0: top_factors.append("No pending assignments")
                        elif feat_name == "overallAverageMarkPercentage" and val >= 70: top_factors.append(f"Good average marks ({val}%)")
                        elif "Consistently strong metrics across the board." not in top_factors:
                             top_factors.append("Consistently strong metrics across the board.")
                    else:
                        top_factors.append(f"{name} ({val:.1f}) is an impacting factor.")
                        
                # Ensure unique strings
                top_factors = list(set(top_factors))
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

if __name__ == "__main__":
    import uvicorn
    # Optional logic to run it directly
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
