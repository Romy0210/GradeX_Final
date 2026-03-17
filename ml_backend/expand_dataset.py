"""
expand_dataset.py

Appends 4000 synthetic student records to the existing student_data.csv,
preserving the exact column schema and realistic data distributions.

Columns:
gpa, attendancePercentage, assignmentCompletionPercentage, pendingAssignments,
overallAverageMarkPercentage, avgInternalMarkPercentage, failingSubjectCount,
lowestSubjectMarkPercentage, riskLevel, outcome, gradeCategory
"""

import pandas as pd
import numpy as np

np.random.seed(2024)

GRADE_THRESHOLDS = [
    (90, 'S'),
    (85, 'A+'),
    (80, 'A'),
    (75, 'B+'),
    (70, 'B'),
    (65, 'C+'),
    (60, 'C'),
    (55, 'D'),
    (0,  'F'),
]

def get_grade(composite_score, outcome):
    if outcome == 'Fail':
        return 'F'
    for threshold, grade in GRADE_THRESHOLDS:
        if composite_score >= threshold:
            return grade
    return 'F'

def generate_student(risk_target):
    """Generate one realistic student record for a given risk category."""

    if risk_target == 'Low':
        gpa                  = round(np.random.uniform(8.5, 10.0), 1)
        attendance           = round(np.random.uniform(88, 100), 1)
        assignment_pct       = round(np.random.uniform(82, 100), 1)
        pending              = np.random.choice([0, 1], p=[0.80, 0.20])
        overall_avg          = round(np.random.uniform(75, 100), 1)
        n_subjects           = np.random.randint(4, 7)
        marks                = [round(np.clip(np.random.normal(overall_avg, 5), 60, 100), 2) for _ in range(n_subjects)]

    elif risk_target == 'Medium':
        gpa                  = round(np.random.uniform(6.5, 9.0), 1)
        attendance           = round(np.random.uniform(75, 95), 1)
        assignment_pct       = round(np.random.uniform(60, 90), 1)
        pending              = np.random.choice([0, 1, 2, 3], p=[0.35, 0.40, 0.15, 0.10])
        overall_avg          = round(np.random.uniform(55, 80), 1)
        n_subjects           = np.random.randint(4, 7)
        marks                = [round(np.clip(np.random.normal(overall_avg, 12), 40, 95), 2) for _ in range(n_subjects)]

    else:  # High
        gpa                  = round(np.random.uniform(4.0, 8.0), 1)
        attendance           = round(np.random.uniform(40, 85), 1)
        assignment_pct       = round(np.random.uniform(20, 75), 1)
        pending              = np.random.choice([1, 2, 3, 4, 5], p=[0.15, 0.25, 0.30, 0.20, 0.10])
        overall_avg          = round(np.random.uniform(30, 65), 1)
        n_subjects           = np.random.randint(4, 7)
        # At least 1 subject must be failing
        n_failing            = np.random.randint(1, min(3, n_subjects) + 1)
        marks                = []
        for i in range(n_subjects):
            if i < n_failing:
                marks.append(round(np.random.uniform(20, 39), 2))
            else:
                marks.append(round(np.clip(np.random.normal(overall_avg, 15), 35, 80), 2))

    avg_internal   = round(np.mean(marks), 2)
    failing_count  = int(sum(1 for m in marks if m < 40))
    lowest_mark    = round(min(marks), 2)

    # Derive outcome
    if risk_target == 'High':
        outcome = 'Fail'
    elif risk_target == 'Low':
        outcome = 'Pass'
    else:
        # Medium: mostly Pass, some Fail
        outcome = np.random.choice(['Pass', 'Fail'], p=[0.75, 0.25])

    # Derive grade category
    composite = (avg_internal * 0.6) + (assignment_pct * 0.2) + (attendance * 0.2)
    grade = get_grade(composite, outcome)

    return {
        'gpa':                            gpa,
        'attendancePercentage':           min(attendance, 100.0),
        'assignmentCompletionPercentage': min(assignment_pct, 100.0),
        'pendingAssignments':             int(pending),
        'overallAverageMarkPercentage':   overall_avg,
        'avgInternalMarkPercentage':      avg_internal,
        'failingSubjectCount':            failing_count,
        'lowestSubjectMarkPercentage':    lowest_mark,
        'riskLevel':                      risk_target,
        'outcome':                        outcome,
        'gradeCategory':                  grade,
    }

# --- Generate 4000 new rows with balanced class distribution ---
# Keep roughly same distribution: High ~65%, Medium ~25%, Low ~10%
N = 4000
counts = {'High': int(N * 0.65), 'Medium': int(N * 0.25), 'Low': N - int(N * 0.65) - int(N * 0.25)}

print(f"Generating {N} new student records...")
print(f"  High: {counts['High']}, Medium: {counts['Medium']}, Low: {counts['Low']}")

new_rows = []
for risk, count in counts.items():
    for _ in range(count):
        new_rows.append(generate_student(risk))

df_new = pd.DataFrame(new_rows)

# Shuffle new rows
df_new = df_new.sample(frac=1, random_state=42).reset_index(drop=True)

# Load existing data
df_existing = pd.read_csv("data/student_data.csv")
print(f"\nExisting rows: {len(df_existing)}")

# Combine and save
df_combined = pd.concat([df_existing, df_new], ignore_index=True)
df_combined = df_combined.sample(frac=1, random_state=99).reset_index(drop=True)  # shuffle all
df_combined.to_csv("data/student_data.csv", index=False)

print(f"New total rows: {len(df_combined)}")
print(f"\nClass distribution:")
print(df_combined['riskLevel'].value_counts())
print(f"\n✅ Saved to data/student_data.csv")
print(f"   Columns: {list(df_combined.columns)}")
