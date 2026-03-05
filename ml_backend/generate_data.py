import pandas as pd
import numpy as np
import random
import os

def generate_synthetic_data(num_records=1000):
    np.random.seed(42)
    random.seed(42)

    data = []
    
    for _ in range(num_records):
        # Generate raw attributes with a mix of good, average, and poor students
        student_type = random.choices(['excellent', 'average', 'poor'], weights=[0.25, 0.5, 0.25])[0]

        if student_type == 'excellent':
            gpa = round(random.uniform(8.0, 10.0), 1)
            attendance = random.randint(85, 100)
            assignment_completion = random.randint(80, 100)
            pending_assignments = random.randint(0, 1)
            avg_mark = random.randint(75, 100)
        elif student_type == 'average':
            gpa = round(random.uniform(6.0, 8.5), 1)
            attendance = random.randint(65, 90)
            assignment_completion = random.randint(50, 85)
            pending_assignments = random.randint(0, 3)
            avg_mark = random.randint(50, 80)
        else: # poor
            gpa = round(random.uniform(4.0, 6.5), 1)
            attendance = random.randint(40, 75)
            assignment_completion = random.randint(20, 60)
            pending_assignments = random.randint(2, 5)
            avg_mark = random.randint(30, 55)

        # Apply deterministic rules from Next.js logic to assign Ground Truth Labels
        
        # 1. RISK LEVEL
        risk_level = "Medium" # Default
        if (gpa < 6.5 or avg_mark < 40 or attendance < 80 or 
            assignment_completion < 70 or pending_assignments >= 3):
            risk_level = "High"
        elif (gpa > 8.0 and avg_mark >= 70 and attendance >= 90 and 
              assignment_completion >= 85 and pending_assignments == 0):
            risk_level = "Low"

        # 2. OUTCOME
        outcome = "Fail" if risk_level == "High" else "Pass"

        # 3. GRADE CATEGORY
        # Base grade mapped from Average Mark
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
            grade_index = 0 # F

        # GPA Adjustment
        if gpa < 6.5: grade_index -= 2
        elif 6.5 <= gpa < 7.5: grade_index -= 1
        elif gpa >= 8.5: grade_index += 1
        
        # Risk Level Adjustment
        if risk_level == "High": 
            final_grade = "F"
        else:
            if risk_level == "Medium": grade_index -= 1
            
            # Ensure within bounds
            grade_index = max(0, min(len(grades_order) - 1, grade_index))
            final_grade = grades_order[grade_index]

        data.append({
            "gpa": gpa,
            "attendancePercentage": attendance,
            "assignmentCompletionPercentage": assignment_completion,
            "pendingAssignments": pending_assignments,
            "overallAverageMarkPercentage": avg_mark,
            "riskLevel": risk_level,
            "outcome": outcome,
            "gradeCategory": final_grade
        })

    df = pd.DataFrame(data)
    
    output_dir = "data"
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "student_data.csv")
    df.to_csv(file_path, index=False)
    print(f"Generated {num_records} records of synthetic data at {file_path}")
    
    # Print distribution
    print("\nRisk Level Distribution:")
    print(df['riskLevel'].value_counts())
    print("\nOutcome Distribution:")
    print(df['outcome'].value_counts())

if __name__ == "__main__":
    generate_synthetic_data(1000)
