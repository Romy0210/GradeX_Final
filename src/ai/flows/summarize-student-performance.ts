'use server';

/**
 * @fileOverview A flow that summarizes a student's overall performance, including key metrics and AI predictions.
 *
 * - summarizeStudentPerformance - A function that handles the summarization process.
 * - SummarizeStudentPerformanceInput - The input type for the summarizeStudentPerformance function.
 * - SummarizeStudentPerformanceOutput - The return type for the summarizeStudentPerformance function.
 */

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

  // Deterministic Summary Generation

  // 1. Performance Qualifier
  let perfDesc = "moderate";
  if (input.gpa >= 8 && input.averageMarkPercentage >= 80) perfDesc = "strong";
  else if (input.gpa < 6.5 || input.averageMarkPercentage < 60) perfDesc = "concerning";

  // 2. Engagement Qualifier
  let engageDesc = "reasonably consistent";
  if (input.attendancePercentage >= 90 && input.assignmentCompletionPercentage >= 85) engageDesc = "highly commendable";
  else if (input.attendancePercentage < 80 || input.assignmentCompletionPercentage < 70) engageDesc = "requiring immediate improvement";

  // 3. Construct base sentences
  let sentence1 = `${input.name} demonstrates ${perfDesc} academic performance with a GPA of ${input.gpa} and an average mark of ${input.averageMarkPercentage}%.`;

  let sentence2 = `Attendance (${input.attendancePercentage}%) and assignment completion (${input.assignmentCompletionPercentage}%) are ${engageDesc}.`;
  if (input.pendingAssignments > 0) {
    sentence2 += ` There are currently ${input.pendingAssignments} pending assignment(s).`;
  } else {
    sentence2 += ` All assignments have been submitted.`;
  }

  // 4. Prediction Assessment
  let sentence3 = `Currently categorized as ${input.riskLevel.toLowerCase()} risk, the student is expected to ${input.outcome.toLowerCase()} with a grade of ${input.gradeCategory}.`;

  // 5. Actionable Closure
  let sentence4 = "Maintaining current habits will ensure continued stability.";
  if (input.riskLevel.toLowerCase() === 'high' || input.outcome.toLowerCase() === 'fail') {
    sentence4 = "Immediate intervention, focused revision, and consistent attendance are critical to improve outcomes.";
  } else if (input.riskLevel.toLowerCase() === 'medium') {
    sentence4 = "Strengthening assignment consistency and addressing weak subjects could further improve academic outcomes.";
  } else {
    sentence4 = "Continuing to engage with advanced materials and maintaining high attendance will support top-tier scores.";
  }

  // Combine paragraph (approx 50-75 words)
  const summary = `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;

  return SummarizeStudentPerformanceOutputSchema.parse({ summary });
}
