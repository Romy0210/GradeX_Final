"""
generate_enriched_data.py

Generates a single clean master training CSV: student_data.csv
Column order: all features first, then labels (riskLevel, outcome, gradeCategory)

gpa, attendancePercentage, assignmentCompletionPercentage, pendingAssignments,
overallAverageMarkPercentage, avgInternalMarkPercentage, failingSubjectCount,
lowestSubjectMarkPercentage, riskLevel, outcome, gradeCategory
"""
import pandas as pd
import numpy as np

np.random.seed(42)

# Load original base data (8 columns)
df = pd.read_csv("data/student_data.csv")

def generate_subject_features(row):
    overall_avg = row['overallAverageMarkPercentage']
    risk = row['riskLevel']
    n_subjects = np.random.randint(4, 7)  # 4-6 subjects per student

    if risk == 'High':
        spread = np.random.uniform(15, 25)
        n_failing = np.random.randint(1, min(3, n_subjects) + 1)
    elif risk == 'Medium':
        spread = np.random.uniform(8, 18)
        n_failing = np.random.randint(0, 2)
    else:  # Low
        spread = np.random.uniform(3, 10)
        n_failing = 0

    marks = []
    for i in range(n_subjects):
        if i < n_failing:
            m = np.random.uniform(20, 39)   # Failing: below 40%
        else:
            m = np.clip(np.random.normal(overall_avg, spread), 35, 100)
        marks.append(m)

    return pd.Series({
        'avgInternalMarkPercentage': round(np.mean(marks), 2),
        'failingSubjectCount': int(sum(1 for m in marks if m < 40)),
        'lowestSubjectMarkPercentage': round(min(marks), 2),
    })

print("Generating subject-level features...")
new_features = df.apply(generate_subject_features, axis=1)

# Build clean master CSV with exact column order requested
master = pd.DataFrame({
    'gpa':                           df['gpa'],
    'attendancePercentage':          df['attendancePercentage'],
    'assignmentCompletionPercentage':df['assignmentCompletionPercentage'],
    'pendingAssignments':            df['pendingAssignments'],
    'overallAverageMarkPercentage':  df['overallAverageMarkPercentage'],
    'avgInternalMarkPercentage':     new_features['avgInternalMarkPercentage'],
    'failingSubjectCount':           new_features['failingSubjectCount'],
    'lowestSubjectMarkPercentage':   new_features['lowestSubjectMarkPercentage'],
    # Labels last
    'riskLevel':                     df['riskLevel'],
    'outcome':                       df['outcome'],
    'gradeCategory':                 df['gradeCategory'],
})

# Save as the single master file (overwrites old student_data.csv)
master.to_csv("data/student_data.csv", index=False)
print(f"✅ Saved clean master CSV to data/student_data.csv")
print(f"   Rows: {len(master)}")
print(f"   Columns ({len(master.columns)}): {list(master.columns)}")
print(f"\nFeature statistics:")
print(master[['avgInternalMarkPercentage', 'failingSubjectCount', 'lowestSubjectMarkPercentage']].describe().round(2))
