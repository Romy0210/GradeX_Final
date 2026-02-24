'use server';

/**
 * @fileOverview Generates personalized recommendations for students based on their risk level, outcome, and grade category.
 *
 * - generatePersonalizedRecommendations - A function that generates personalized recommendations for a student.
 * - PersonalizedRecommendationsInput - The input type for the generatePersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the generatePersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SubjectAnalysisSchema = z.object({
  subjectId: z.string(),
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
    subjectId: z.string(),
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
  return generatePersonalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are an AI-powered academic advisor. Your task is to generate personalized recommendations for a student based on their overall performance and subject-specific analysis.

  **Part 1: Overall Recommendations**
  Based on the student's overall data, provide tailored recommendations in three categories: Academic, Behavioral, and Intervention. For each category, provide a single, well-written paragraph of about 50-75 words.

  Overall Student Data:
  - Risk Level: {{riskLevel}}
  - Predicted Outcome: {{outcome}}
  - Predicted Grade Category: {{gradeCategory}}
  - Academic Performance Summary: {{academicPerformance}}
  - Overall Attendance: {{attendancePercentage}}%
  - Assignment Completion: {{assignmentCompletionPercentage}}%
  - Pending Assignments: {{pendingAssignments}}

  **Part 2: Subject-Specific Recommendations**
  {{#if subjectAnalyses}}
  Now, analyze the performance for each subject and provide a specific, actionable recommendation for each one. The recommendation should be a concise paragraph (about 40-60 words) tailored to the subject's specific risk level, grade, and attendance.

  Subject-Wise Data:
  {{#each subjectAnalyses}}
  - Subject: {{subjectName}}
    - Risk Level: {{riskLevel}}
    - Predicted Grade: {{gradeCategory}}
    - Attendance: {{subjectAttendancePercentage}}%
  {{/each}}
  
  For each subject, generate a recommendation. For high-risk subjects, suggest revision strategies, practice, or mentoring. For subjects with low attendance, specifically mention the need to improve it, even if the marks are good. For medium-risk, suggest improvement areas. For low-risk, suggest advanced topics or challenges.
  {{/if}}
  
  **Output Format**
  Generate a single JSON object that strictly follows the output schema. It must contain 'academicRecommendations', 'behavioralRecommendations', and 'interventionRecommendations' fields for the overall summary. If subject data is provided, it must also include a 'subjectRecommendations' array, with an object for each subject containing 'subjectId', 'subjectName', and 'recommendation'.
  `,
});

const generatePersonalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
