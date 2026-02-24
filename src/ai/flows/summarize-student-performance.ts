'use server';

/**
 * @fileOverview A flow that summarizes a student's overall performance, including key metrics and AI predictions.
 *
 * - summarizeStudentPerformance - A function that handles the summarization process.
 * - SummarizeStudentPerformanceInput - The input type for the summarizeStudentPerformance function.
 * - SummarizeStudentPerformanceOutput - The return type for the summarizeStudentPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudentPerformanceInputSchema = z.object({
  name: z.string().describe('The name of the student.'),
  gpa: z.number().describe('The GPA of the student (out of 10).'),
  internalMark1: z.number().describe('Internal Mark 1 (out of 40).'),
  internalMark2: z.number().describe('Internal Mark 2 (out of 40).'),
  averageMarkPercentage: z
    .number()
    .describe('The average mark percentage of the student.'),
  attendancePercentage: z
    .number()
    .describe('The attendance percentage of the student.'),
  assignmentCompletionPercentage: z
    .number()
    .describe('The assignment completion percentage of the student.'),
  pendingAssignments: z.number().describe('The number of pending assignments.'),
  riskLevel: z.string().describe('The predicted risk level of the student.'),
  outcome: z.string().describe('The predicted outcome (Pass/Fail) for the student.'),
  gradeCategory: z.string().describe('The predicted grade category for the student.'),
  confidenceOrRiskProbability: z
    .number()
    .describe(
      'The prediction confidence (if outcome is Pass) or failure risk probability (if outcome is Fail) as a percentage.'
    ),
});
export type SummarizeStudentPerformanceInput = z.infer<typeof SummarizeStudentPerformanceInputSchema>;

const SummarizeStudentPerformanceOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the student’s overall performance.'),
});
export type SummarizeStudentPerformanceOutput = z.infer<typeof SummarizeStudentPerformanceOutputSchema>;

export async function summarizeStudentPerformance(
  input: SummarizeStudentPerformanceInput
): Promise<SummarizeStudentPerformanceOutput> {
  return summarizeStudentPerformanceFlow(input);
}

const summarizeStudentPerformancePrompt = ai.definePrompt({
  name: 'summarizeStudentPerformancePrompt',
  input: {schema: SummarizeStudentPerformanceInputSchema},
  output: {schema: SummarizeStudentPerformanceOutputSchema},
  prompt: `Summarize the overall performance of student {{name}} based on the following metrics and AI predictions:\n\nGPA: {{gpa}}\nInternal Mark 1: {{internalMark1}}\nInternal Mark 2: {{internalMark2}}\nAverage Mark Percentage: {{averageMarkPercentage}}\nAttendance Percentage: {{attendancePercentage}}\nAssignment Completion Percentage: {{assignmentCompletionPercentage}}\nPending Assignments: {{pendingAssignments}}\nRisk Level: {{riskLevel}}\nOutcome: {{outcome}}\nGrade Category: {{gradeCategory}}\nConfidence/Risk Probability: {{confidenceOrRiskProbability}}\n\nProvide a concise summary (around 50-75 words) highlighting key strengths, weaknesses, and potential areas of concern.`,
});

const summarizeStudentPerformanceFlow = ai.defineFlow(
  {
    name: 'summarizeStudentPerformanceFlow',
    inputSchema: SummarizeStudentPerformanceInputSchema,
    outputSchema: SummarizeStudentPerformanceOutputSchema,
  },
  async input => {
    const {output} = await summarizeStudentPerformancePrompt(input);
    return {
      ...output,
    };
  }
);
