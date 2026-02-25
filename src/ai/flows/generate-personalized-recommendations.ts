'use server';

/**
 * @fileOverview Generates personalized recommendations for students based on their risk level, outcome, and grade category.
 *
 * - generatePersonalizedRecommendations - A function that generates personalized recommendations for a student.
 * - PersonalizedRecommendationsInput - The input type for the generatePersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the generatePersonalizedRecommendations function.
 */

import { openrouter, MODEL } from '@/ai/genkit';
import { z } from 'zod';

const SubjectAnalysisSchema = z.object({
  subjectId: z.coerce.string(),
  subjectName: z.string(),
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  outcome: z.enum(['Pass', 'Fail']),
  gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
  subjectAttendancePercentage: z.number().optional(),
});

const PersonalizedRecommendationsInputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe("The student's risk level."),
  outcome: z.enum(['Pass', 'Fail']).describe('The predicted outcome for the student.'),
  gradeCategory: z.string().describe('The grade category of the student.'),
  academicPerformance: z.string().describe("Summary of the student's academic performance."),
  attendancePercentage: z.number().describe("The student's attendance percentage."),
  assignmentCompletionPercentage: z.number().describe("The student's assignment completion percentage."),
  pendingAssignments: z.number().describe('The number of pending assignments for the student.'),
  subjectAnalyses: z.array(SubjectAnalysisSchema).optional().describe('The subject-wise analysis results.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const SubjectRecommendationSchema = z.object({
  subjectId: z.coerce.string(),
  subjectName: z.string(),
  recommendation: z.string().describe('A paragraph of AI-driven recommendations specific to this subject.'),
});

const PersonalizedRecommendationsOutputSchema = z.object({
  academicRecommendations: z.string().describe('A paragraph of AI-driven academic recommendations for the student.'),
  behavioralRecommendations: z.string().describe('A paragraph of AI-driven behavioral recommendations for the student.'),
  interventionRecommendations: z.string().describe('A paragraph of risk-based intervention recommendations for the student.'),
  subjectRecommendations: z.array(SubjectRecommendationSchema).optional().describe('An array of subject-specific recommendations.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function generatePersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  let subjectSection = '';
  if (input.subjectAnalyses && input.subjectAnalyses.length > 0) {
    subjectSection = `
  **Part 2: Subject-Specific Recommendations**
  Now, analyze the performance for each subject and provide a specific, actionable recommendation for each one. The recommendation should be a concise paragraph (about 40-60 words) tailored to the subject's specific risk level, grade, and attendance.

  Subject-Wise Data:
${input.subjectAnalyses.map(s => `  - Subject: ${s.subjectName}
    - Risk Level: ${s.riskLevel}
    - Predicted Grade: ${s.gradeCategory}
    - Attendance: ${s.subjectAttendancePercentage ?? 0}%`).join('\n')}
  
  For each subject, generate a recommendation. For high-risk subjects, suggest revision strategies, practice, or mentoring. For subjects with low attendance, specifically mention the need to improve it, even if the marks are good. For medium-risk, suggest improvement areas. For low-risk, suggest advanced topics or challenges.

  Include a "subjectRecommendations" array in the output with objects containing "subjectId", "subjectName", and "recommendation" for each subject.`;
  }

  const prompt = `You are an AI-powered academic advisor. Your task is to generate personalized recommendations for a student based on their overall performance and subject-specific analysis.

  **Part 1: Overall Recommendations**
  Based on the student's overall data, provide tailored recommendations in three categories: Academic, Behavioral, and Intervention. For each category, provide a single, well-written paragraph of about 50-75 words.

  Overall Student Data:
  - Risk Level: ${input.riskLevel}
  - Predicted Outcome: ${input.outcome}
  - Predicted Grade Category: ${input.gradeCategory}
  - Academic Performance Summary: ${input.academicPerformance}
  - Overall Attendance: ${input.attendancePercentage}%
  - Assignment Completion: ${input.assignmentCompletionPercentage}%
  - Pending Assignments: ${input.pendingAssignments}

  ${subjectSection}
  
  **Output Format**
  Generate a single JSON object with these fields: "academicRecommendations", "behavioralRecommendations", "interventionRecommendations"${input.subjectAnalyses ? ', and "subjectRecommendations" (array of {subjectId, subjectName, recommendation})' : ''}.
  
  Return ONLY valid JSON.`;

  const completion = await openrouter.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return PersonalizedRecommendationsOutputSchema.parse(parsed);
}
