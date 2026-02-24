'use server';

/**
 * @fileOverview Predicts student risk level (low, medium, high) based on academic and behavioral data.
 *
 * - predictStudentRiskLevel - A function that handles the risk level prediction process.
 * - PredictStudentRiskLevelInput - The input type for the predictStudentRiskLevel function.
 * - PredictStudentRiskLevelOutput - The return type for the predictStudentRiskLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return predictStudentRiskLevelFlow(input);
}

const predictStudentRiskLevelPrompt = ai.definePrompt({
  name: 'predictStudentRiskLevelPrompt',
  input: {schema: PredictStudentRiskLevelInputSchema},
  output: {schema: PredictStudentRiskLevelOutputSchema},
  prompt: `You are an expert AI system designed to predict student academic risk with high accuracy. Your analysis must be based on a strict set of rules.

Analyze the student's data and predict their risk level.

**Student Data:**
- GPA (out of 10): {{gpa}}
- Attendance Percentage: {{attendancePercentage}}%
- Assignment Completion Percentage: {{assignmentCompletion}}%
- Pending Assignments: {{pendingAssignments}}

**Prediction Rules:**

**1. Risk Level Prediction:**
- **high**: Assign if ANY of the following are true:
    - GPA is below 6.5.
    - Attendance is below 80%.
    - Assignment Completion is below 70%.
    - Pending Assignments are 3 or more.
- **medium**: Assign if NOT high and ANY of the following are true:
    - GPA is between 6.5 and 7.9.
    - Attendance is between 80% and 89%.
    - Pending Assignments are 1 or 2.
- **low**: Assign if NOT high or medium. All metrics must be strong (e.g., GPA >= 8.0, Attendance >= 90%).

For the \`explanation\`, briefly state which rules were triggered to determine the risk level.

Provide the response in a JSON object that matches the specified output schema. The risk level must be one of 'low', 'medium', or 'high'.`,
});

const predictStudentRiskLevelFlow = ai.defineFlow(
  {
    name: 'predictStudentRiskLevelFlow',
    inputSchema: PredictStudentRiskLevelInputSchema,
    outputSchema: PredictStudentRiskLevelOutputSchema,
  },
  async input => {
    const {output} = await predictStudentRiskLevelPrompt(input);
    return output!;
  }
);
