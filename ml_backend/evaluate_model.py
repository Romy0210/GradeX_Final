"""
evaluate_model.py

Evaluates the trained risk_model.pkl on the full dataset.
Shows accuracy, F1-score, per-class metrics, and feature importances.
"""
import pandas as pd
import numpy as np
import joblib
import json
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, f1_score
)

# Load model artifacts
model   = joblib.load("risk_model.pkl")
encoder = joblib.load("label_encoder.pkl")
with open("feature_names.json") as f:
    feature_names = json.load(f)

# Load & engineer data (same as train_model.py)
df = pd.read_csv("data/student_data.csv")
df['assignment_ratio'] = df['assignmentCompletionPercentage'] / 100.0
df['composite_score']  = (
    (df['avgInternalMarkPercentage']      * 0.6) +
    (df['assignmentCompletionPercentage'] * 0.2) +
    (df['attendancePercentage']           * 0.2)
)
df['has_failing_subject'] = (df['failingSubjectCount'] > 0).astype(int)

X = df[feature_names]
y = encoder.transform(df['riskLevel'])
classes = encoder.classes_

# --- Hold-out test split (same seed as training) ---
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
f1       = f1_score(y_test, y_pred, average='weighted')

print("=" * 55)
print("       GradeX ML Model — Evaluation Report")
print("=" * 55)
print(f"  Total samples   : {len(df)}")
print(f"  Training samples: {len(X_train)}")
print(f"  Test samples    : {len(X_test)}")
print("-" * 55)
print(f"  Accuracy        : {accuracy*100:.2f}%")
print(f"  F1-Score        : {f1*100:.2f}%")
print("-" * 55)

# Cross-validation for more reliable estimate
cv   = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cvs  = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
print(f"  Cross-Val Acc   : {cvs.mean()*100:.2f}% ± {cvs.std()*100:.2f}%")
print("=" * 55)

print("\nPer-Class Report:")
print(classification_report(y_test, y_pred, target_names=classes))

print("Confusion Matrix (rows=actual, cols=predicted):")
cm = confusion_matrix(y_test, y_pred)
cm_df = pd.DataFrame(cm, index=[f"Actual {c}" for c in classes],
                          columns=[f"Pred {c}" for c in classes])
print(cm_df.to_string())

print("\nTop Feature Importances:")
importances = pd.Series(model.feature_importances_, index=feature_names)
print(importances.sort_values(ascending=False).apply(lambda x: f"{x*100:.2f}%").to_string())
