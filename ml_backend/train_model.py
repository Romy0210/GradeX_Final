import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder
import joblib
import json

def load_data(filepath="data/student_data.csv"):
    df = pd.read_csv(filepath)
    return df

def feature_engineering(df):
    """
    Create composite score and derived features
    """
    df_engineered = df.copy()
    
    # Assignment Completion Ratio (assuming max 5 pending)
    # This feature represents completing assignments successfully vs missing them
    df_engineered['assignment_ratio'] = df_engineered['assignmentCompletionPercentage'] / 100.0
    
    # Composite Score according to plan: 
    # (Average Mark * 0.6) + (Assignment Score * 0.2) + (Attendance Score * 0.2)
    df_engineered['composite_score'] = (
        (df_engineered['overallAverageMarkPercentage'] * 0.6) + 
        (df_engineered['assignmentCompletionPercentage'] * 0.2) + 
        (df_engineered['attendancePercentage'] * 0.2)
    )
    
    return df_engineered

def train_risk_model(df):
    print("--- Training Risk Level Model ---")
    # Features & Target
    X = df[['gpa', 'attendancePercentage', 'assignmentCompletionPercentage', 
            'pendingAssignments', 'overallAverageMarkPercentage', 
            'assignment_ratio', 'composite_score']]
    y = df['riskLevel']

    # Encode target labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Save target names mapping for later
    risk_classes = le.classes_
    print(f"Risk Classes: {risk_classes}")

    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
    
    # Random Forest Setup
    rf = RandomForestClassifier(random_state=42)
    
    # Hyperparameter tuning using GridSearchCV
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 5, 10, 15],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4]
    }
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=cv, scoring='f1_weighted', n_jobs=-1, verbose=1)
    
    print("Running GridSearchCV...")
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    print(f"Best Parameters: {grid_search.best_params_}")
    
    # Evaluation
    y_pred = best_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"\nModel Accuracy: {accuracy:.4f}")
    print(f"Model F1-Score: {f1:.4f}")
    
    if accuracy < 0.8:
        print("WARNING: Model did not achieve 80% accuracy minimum.")
        
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=risk_classes))
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Save Model & Encoder
    joblib.dump(best_model, "risk_model.pkl")
    joblib.dump(le, "label_encoder.pkl")
    print("\nSaved `risk_model.pkl` and `label_encoder.pkl`")
    
    # Also save the feature names used for training since order matters
    feature_names = X.columns.tolist()
    with open("feature_names.json", "w") as f:
        json.dump(feature_names, f)
        
    return best_model, le, X_train

def main():
    print("Loading Dataset...")
    df = load_data()
    
    print("Engineering Features...")
    df_engineered = feature_engineering(df)
    
    print("Training Model...")
    best_model, le, X_train = train_risk_model(df_engineered)
    
    print("--- Training COMPLETE ---")

if __name__ == '__main__':
    main()
