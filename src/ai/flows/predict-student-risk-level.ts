'use server';

/**
 * @fileOverview Predicts student risk level (low, medium, high) based on academic and behavioral data.
 *
 * - predictStudentRiskLevel - A function that handles the risk level prediction process.
 * - PredictStudentRiskLevelInput - The input type for the predictStudentRiskLevel function.
 * - PredictStudentRiskLevelOutput - The return type for the predictStudentRiskLevel function.
 */

import { z } from 'zod';

const PredictStudentRiskLevelInputSchema = z.object({
  gpa: z.number().describe('GPA out of 10'),
  attendancePercentage: z.number().describe('Attendance Percentage (%)'),
  assignmentCompletion: z.number().describe('Assignment Completion (percentage)'),
  pendingAssignments: z.number().describe('Number of Pending Assignments'),
});
export type PredictStudentRiskLevelInput = z.infer<typeof PredictStudentRiskLevelInputSchema>;

const PredictStudentRiskLevelOutputSchema = z.object({
  riskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('The predicted risk level of the student.'),
  explanation: z.string().describe('Explanation of why the student is at that risk level'),
});
export type PredictStudentRiskLevelOutput = z.infer<typeof PredictStudentRiskLevelOutputSchema>;

export async function predictStudentRiskLevel(
  input: PredictStudentRiskLevelInput
): Promise<PredictStudentRiskLevelOutput> {
  const mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000/predict';

  try {
    const response = await fetch(mlApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gpa: input.gpa,
        attendancePercentage: input.attendancePercentage,
        assignmentCompletionPercentage: input.assignmentCompletion,
        pendingAssignments: input.pendingAssignments,
        // Approximate average mark from GPA if it's not provided by the current input schema
        overallAverageMarkPercentage: input.gpa * 10
      }),
    });

    if (!response.ok) {
      console.error(`ML API Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      throw new Error(`ML API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Map capitalized riskLevel ('Low', 'Medium', 'High') to lowercase
    let mappedRisk = (data.riskLevel || 'medium').toLowerCase();
    if (!['low', 'medium', 'high'].includes(mappedRisk)) {
      mappedRisk = 'medium';
    }

    // Construct explanation from topFactors and probability
    const factorsText = Array.isArray(data.topFactors) && data.topFactors.length > 0
      ? data.topFactors.join(' ')
      : "Based on academic and engagement metrics.";

    const explanation = `Confidence: ${data.probability || 0}%. ${factorsText}`;

    return PredictStudentRiskLevelOutputSchema.parse({
      riskLevel: mappedRisk,
      explanation: explanation
    });

  } catch (error) {
    console.error("ML Prediction Server request failed:", error);
    // Fallback if the Python API is not running
    return {
      riskLevel: "medium",
      explanation: "ML Prediction service is currently unavailable. Defaulting to medium risk."
    };
  }
}
