import pandas as pd
import numpy as np
import random
import os

def generate_synthetic_data():
    np.random.seed(42)
    random.seed(42)

    # 1. DEFINE TARGETS
    # High Risk (4,000): all F
    # Medium Risk (4,000): D, C, C+, B, B+ (800 each)
    # Low Risk (3,000): A, A+, S (1,000 each)
    target_buckets = {
        ('High', 'F'): 4000,
        ('Medium', 'D'): 800,
        ('Medium', 'C'): 800,
        ('Medium', 'C+'): 800,
        ('Medium', 'B'): 800,
        ('Medium', 'B+'): 800,
        ('Low', 'A'): 1000,
        ('Low', 'A+'): 1000,
        ('Low', 'S'): 1000,
    }
    
    current_buckets = {k: 0 for k in target_buckets}
    data = []
    
    print(f"Generating synthetic data with precision targets: {target_buckets}...")
    
    while any(current_buckets[k] < target_buckets[k] for k in target_buckets):
        # Choose a bucket that still needs records
        needed_buckets = [k for k, v in target_buckets.items() if current_buckets[k] < v]
        # Weighted choice towards needed risk levels for even growth
        target_risk, target_grade = random.choice(needed_buckets)

        # 2. GENERATE ATTRIBUTES TO HIT TARGET GRADE/RISK
        # Thresholds: S>=90, A+>=85, A>=80, B+>=75, B>=70, C+>=65, C>=60, D>=55, F<55
        
        if target_grade == 'S':
            avg_mark = random.randint(92, 100)
            gpa = round(random.uniform(9.0, 10.0), 1)
            attendance = random.randint(90, 100)
            assignment_completion = random.randint(90, 100)
        elif target_grade == 'A+':
            avg_mark = random.randint(86, 89)
            gpa = round(random.uniform(8.5, 9.2), 1)
            attendance = random.randint(85, 95)
            assignment_completion = random.randint(85, 95)
        elif target_grade == 'A':
            avg_mark = random.randint(81, 84)
            gpa = round(random.uniform(8.0, 8.8), 1)
            attendance = random.randint(80, 90)
            assignment_completion = random.randint(80, 90)
        elif target_grade == 'B+':
            avg_mark = random.randint(76, 79)
            gpa = round(random.uniform(7.5, 8.4), 1)
            attendance = random.randint(75, 85)
            assignment_completion = random.randint(75, 85)
        elif target_grade == 'B':
            avg_mark = random.randint(71, 74)
            gpa = round(random.uniform(7.0, 7.8), 1)
            attendance = random.randint(70, 80)
            assignment_completion = random.randint(70, 80)
        elif target_grade == 'C+':
            avg_mark = random.randint(66, 69)
            gpa = round(random.uniform(6.5, 7.4), 1)
            attendance = random.randint(65, 75)
            assignment_completion = random.randint(65, 75)
        elif target_grade == 'C':
            avg_mark = random.randint(61, 64)
            gpa = round(random.uniform(6.0, 6.8), 1)
            attendance = random.randint(60, 70)
            assignment_completion = random.randint(60, 70)
        elif target_grade == 'D':
            avg_mark = random.randint(56, 59)
            gpa = round(random.uniform(5.5, 6.4), 1)
            attendance = random.randint(60, 68)
            assignment_completion = random.randint(55, 65)
        else: # F
            avg_mark = random.randint(20, 50) # Definitely below 55
            gpa = round(random.uniform(2.0, 5.0), 1)
            attendance = random.randint(30, 64)
            assignment_completion = random.randint(10, 50)

        pending_assignments = 0 if target_grade in ['S', 'A+', 'A'] else random.randint(0, 4)

        # 3. CALCULATE RISK & GRADE (Consistency Check)
        score = (
            (avg_mark * 0.70) + 
            (assignment_completion * 0.12) + 
            (gpa * 10 * 0.10) + 
            (attendance * 0.08)
        )

        risk_level = "Medium"
        if score < 50 or avg_mark < 55 or attendance < 65:
            risk_level = "High"
        elif score > 85:
            risk_level = "Low"
        
        outcome = "Fail" if (risk_level == "High") else "Pass"
        
        # Determine actual grade from avg_mark
        if avg_mark >= 90: actual_grade = 'S'
        elif avg_mark >= 85: actual_grade = 'A+'
        elif avg_mark >= 80: actual_grade = 'A'
        elif avg_mark >= 75: actual_grade = 'B+'
        elif avg_mark >= 70: actual_grade = 'B'
        elif avg_mark >= 65: actual_grade = 'C+'
        elif avg_mark >= 60: actual_grade = 'C'
        elif avg_mark >= 55: actual_grade = 'D'
        else: actual_grade = 'F'

        # Ensure we hit the exact target bucket
        final_key = (risk_level, actual_grade)
        
        if final_key in target_buckets and current_buckets[final_key] < target_buckets[final_key]:
            current_buckets[final_key] += 1
            data.append({
                "gpa": gpa,
                "attendancePercentage": attendance,
                "assignmentCompletionPercentage": assignment_completion,
                "pendingAssignments": pending_assignments,
                "overallAverageMarkPercentage": avg_mark,
                "riskLevel": risk_level,
                "outcome": outcome,
                "gradeCategory": actual_grade
            })

    df = pd.DataFrame(data)
    output_dir = "data"
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "student_data.csv")
    df.to_csv(file_path, index=False)
    print(f"Generated {len(df)} records of synthetic data at {file_path}")
    
    print("\nRisk Level Distribution:")
    print(df['riskLevel'].value_counts())
    print("\nGrade Category Distribution:")
    print(df['gradeCategory'].value_counts().sort_index())

if __name__ == "__main__":
    generate_synthetic_data()
