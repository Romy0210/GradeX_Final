'use server';

/**
 * @fileOverview A flow that summarizes a student's overall performance, including key metrics and AI predictions.
 *
 * - summarizeStudentPerformance - A function that handles the summarization process.
 * - SummarizeStudentPerformanceInput - The input type for the summarizeStudentPerformance function.
 * - SummarizeStudentPerformanceOutput - The return type for the summarizeStudentPerformance function.
 */

import { openrouter, MODEL } from '@/ai/genkit';
import { z } from 'zod';

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
  summary: z.string().describe('A concise summary of the student\'s overall performance.'),
});
export type SummarizeStudentPerformanceOutput = z.infer<typeof SummarizeStudentPerformanceOutputSchema>;

export async function summarizeStudentPerformance(
  input: SummarizeStudentPerformanceInput
): Promise<SummarizeStudentPerformanceOutput> {
  const prompt = `Summarize the overall performance of student ${input.name} based on the following metrics and AI predictions:

GPA: ${input.gpa}
Internal Mark 1: ${input.internalMark1}
Internal Mark 2: ${input.internalMark2}
Average Mark Percentage: ${input.averageMarkPercentage}
Attendance Percentage: ${input.attendancePercentage}
Assignment Completion Percentage: ${input.assignmentCompletionPercentage}
Pending Assignments: ${input.pendingAssignments}
Risk Level: ${input.riskLevel}
Outcome: ${input.outcome}
Grade Category: ${input.gradeCategory}
Confidence/Risk Probability: ${input.confidenceOrRiskProbability}

Provide a concise summary (around 50-75 words) highlighting key strengths, weaknesses, and potential areas of concern.

Return ONLY a JSON object with this exact format: { "summary": "..." }`;

  const completion = await openrouter.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return SummarizeStudentPerformanceOutputSchema.parse(parsed);
}
