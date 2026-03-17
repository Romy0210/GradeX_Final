'use server';

/**
 * @fileOverview
 * Runs a full analysis on a student's performance to predict risk,
 * outcome, grade, and confidence, using the new local Machine Learning FastAPI prediction service.
 * Includes deterministic subject-wise breakdown.
 */

import { z } from 'zod';

/* ===============================
   1. INPUT SCHEMA
================================ */

const RunStudentAnalysisInputSchema = z.object({
  gpa: z.number().describe('GPA out of 10'),
  attendancePercentage: z.number().describe('Attendance Percentage (%)'),
  assignmentCompletionPercentage: z.number().describe('Overall Assignment Completion Percentage (%)'),
  pendingAssignments: z.number().describe('Total Number of Pending Assignments'),
  overallAverageMarkPercentage: z.number().describe('Overall Average Mark Percentage'),
  subjects: z.array(z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    internalMark1: z.number(),
    internalMark2: z.number(),
    totalAssignments: z.number(),
    completedAssignments: z.number(),
    subjectAttendancePercentage: z.number().optional(),
  })).optional(),
  highRiskThreshold: z.number().optional(),
  lowRiskThreshold: z.number().optional(),
});

export type RunStudentAnalysisInput = z.infer<
  typeof RunStudentAnalysisInputSchema
>;

/* ===============================
   2. OUTPUT SCHEMA
================================ */

const SubjectAnalysisOutputSchema = z.object({
  subjectId: z.coerce.string().describe("The unique identifier for the subject."),
  subjectName: z.string().describe("The name of the subject."),
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe("The predicted risk level for this subject."),
  outcome: z.enum(['Pass', 'Fail']).describe("The predicted outcome for this subject."),
  gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).describe("The predicted grade for this subject."),
});

const RunStudentAnalysisOutputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  outcome: z.enum(['Pass', 'Fail']),
  gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
  predictionConfidence: z.number().optional(),
  failureRiskProbability: z.number().optional(),
  subjectAnalyses: z.array(SubjectAnalysisOutputSchema).optional().describe("An array of AI analyses for each individual subject."),
  topFactors: z.array(z.string()).optional().describe("SHAP generated explanatory factors from the ML Model"),
});

export type RunStudentAnalysisOutput = z.infer<
  typeof RunStudentAnalysisOutputSchema
>;

/* ===============================
   3. EXPORTED FUNCTION
================================ */

export async function runStudentAnalysis(
  input: RunStudentAnalysisInput
): Promise<RunStudentAnalysisOutput> {

  // 1. Compute per-subject internal mark signals from the real subject data
  let avgInternalMarkPercentage: number | undefined;
  let failingSubjectCount: number | undefined;
  let lowestSubjectMarkPercentage: number | undefined;

  if (input.subjects && input.subjects.length > 0) {
    const subjectMarkPercentages = input.subjects.map(s => {
      const totalMark = (s.internalMark1 ?? 0) + (s.internalMark2 ?? 0);
      return (totalMark / 80) * 100; // Each internal is out of 40, total out of 80
    });
    avgInternalMarkPercentage = parseFloat(
      (subjectMarkPercentages.reduce((a, b) => a + b, 0) / subjectMarkPercentages.length).toFixed(2)
    );
    failingSubjectCount = subjectMarkPercentages.filter(m => m < 40).length;
    lowestSubjectMarkPercentage = parseFloat(Math.min(...subjectMarkPercentages).toFixed(2));
  }

  // 2. Call the Local FastAPI Machine Learning Prediction Service
  let mlPrediction;
  try {
    const response = await fetch("http://127.0.0.1:8000/predict-student-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gpa: input.gpa,
        attendancePercentage: input.attendancePercentage,
        assignmentCompletionPercentage: input.assignmentCompletionPercentage,
        pendingAssignments: input.pendingAssignments,
        overallAverageMarkPercentage: input.overallAverageMarkPercentage,
        // Real subject-level internal mark signals
        ...(avgInternalMarkPercentage !== undefined && { avgInternalMarkPercentage }),
        ...(failingSubjectCount !== undefined && { failingSubjectCount }),
        ...(lowestSubjectMarkPercentage !== undefined && { lowestSubjectMarkPercentage }),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ML service: ${response.statusText}`);
    }

    mlPrediction = await response.json();
  } catch (error) {
    console.error("ML Prediction Error:", error);
    // Fallback if ML service is down or errors. 
    // This allows the app to continue functioning gracefully by falling back to deterministic rules if the server isn't running.
    mlPrediction = {
      riskLevel: "Medium",
      outcome: "Pass",
      gradeCategory: "C",
      probability: 0,
      topFactors: ["ML Service Unavailable - using fallback predictions."]
    };
  }

  // 2. Perform subject-wise deterministic analysis since the ML model focuses on overall student metrics
  const subjectAnalyses = [];
  if (input.subjects && input.subjects.length > 0) {
    for (const s of input.subjects) {
      // Calculate & Normalize
      const avgMarkPercentage = ((s.internalMark1 + s.internalMark2) / 80) * 100;
      const attendanceScore = s.subjectAttendancePercentage ?? 0;

      let assignmentScore = 0;
      if (s.totalAssignments === 5) {
        if (s.completedAssignments === 5) assignmentScore = 100;
        else if (s.completedAssignments === 4) assignmentScore = 95;
        else if (s.completedAssignments === 3) assignmentScore = 85;
        else if (s.completedAssignments === 2) assignmentScore = 75;
        else assignmentScore = 60;
      } else if (s.totalAssignments > 0) {
        assignmentScore = (s.completedAssignments / s.totalAssignments) * 100;
      }

      // Composite Score
      const compositeScore = (avgMarkPercentage * 0.6) + (assignmentScore * 0.2) + (attendanceScore * 0.2);

      // Determine Base Subject Grade
      let baseGrade = 'F';
      if (compositeScore >= 90) baseGrade = 'S';
      else if (compositeScore >= 85) baseGrade = 'A+';
      else if (compositeScore >= 80) baseGrade = 'A';
      else if (compositeScore >= 75) baseGrade = 'B+';
      else if (compositeScore >= 70) baseGrade = 'B';
      else if (compositeScore >= 65) baseGrade = 'C+';
      else if (compositeScore >= 60) baseGrade = 'C';
      else if (compositeScore >= 55) baseGrade = 'D';

      // Critical override
      if (avgMarkPercentage < 40) {
        baseGrade = 'F';
      }

      // Determine Subject Risk & Outcome
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
      let outcome: 'Pass' | 'Fail' = 'Pass';

      if (['S', 'A+', 'A'].includes(baseGrade)) {
        riskLevel = 'Low';
      } else if (['B+', 'B', 'C+', 'C', 'D'].includes(baseGrade)) {
        riskLevel = 'Medium';
      } else if (baseGrade === 'F') {
        riskLevel = 'High';
        outcome = 'Fail';
      }

      subjectAnalyses.push({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        riskLevel,
        outcome,
        gradeCategory: baseGrade as any,
      });
    }
  }

  // 3. Construct Final Output based on ML Prediction
  const finalOutput: RunStudentAnalysisOutput = {
    riskLevel: mlPrediction.riskLevel,
    outcome: mlPrediction.outcome,
    gradeCategory: mlPrediction.gradeCategory,
    topFactors: mlPrediction.topFactors,
  };

  // 4. Override with Subject Analysis Results
  // If ANY subject has a 'High' risk level, the overall risk MUST be 'High'
  const hasHighRiskSubject = subjectAnalyses.some(s => s.riskLevel === 'High');
  if (hasHighRiskSubject) {
    finalOutput.riskLevel = 'High';
    finalOutput.outcome = 'Fail';
    finalOutput.gradeCategory = 'F';
    
    const factorMsg = "High risk factor: Failing one or more individual subjects.";
    if (finalOutput.topFactors && !finalOutput.topFactors.includes(factorMsg)) {
      finalOutput.topFactors.push(factorMsg);
    } else if (!finalOutput.topFactors) {
      finalOutput.topFactors = [factorMsg];
    }
  }

  if (mlPrediction.outcome === 'Pass') {
    finalOutput.predictionConfidence = mlPrediction.probability;
  } else {
    finalOutput.failureRiskProbability = mlPrediction.probability;
  }

  if (subjectAnalyses.length > 0) {
    finalOutput.subjectAnalyses = subjectAnalyses;
  }

  return RunStudentAnalysisOutputSchema.parse(finalOutput);
}
