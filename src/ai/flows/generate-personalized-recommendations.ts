'use server';

/**
 * @fileOverview Generates personalized recommendations for students based on their risk level, outcome, and grade category.
 *
 * - generatePersonalizedRecommendations - A function that generates personalized recommendations for a student.
 * - PersonalizedRecommendationsInput - The input type for the generatePersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the generatePersonalizedRecommendations function.
 */

import { z } from 'zod';
import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    'HTTP-Referer': 'https://gradex.pro',
    'X-Title': 'GradeX',
  },
});

const MODEL = 'arcee-ai/trinity-large-preview:free';

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
  recommendation: z.string().describe('A 1-2 sentence AI-driven recommendation specific to this subject based on the student stats.'),
});

const PersonalizedRecommendationsOutputSchema = z.object({
  academicRecommendations: z.string().describe('Explain the "Reasoning" behind their academic performance and give "Actionable Steps" to fix issues OR maintain excellence. Write in very simple English.'),
  behavioralRecommendations: z.string().describe('Explain the "Reasoning" behind their attendance/assignments and give "Actionable Steps" to fix issues OR maintain excellence. Write in very simple English.'),
  interventionRecommendations: z.string().describe('Explain why help is needed and give "Actionable Steps", OR provide high praise and motivation if they are performing exceptionally well. Write in very simple English.'),
  subjectRecommendations: z.array(SubjectRecommendationSchema).describe('An array of subject-specific recommendations. Return empty array if none.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function generatePersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {

  // For privacy, we only send statistical data to the LLM, NO PII (No name, email, etc.)
  const promptData = {
    riskLevel: input.riskLevel,
    outcome: input.outcome,
    gradeCategory: input.gradeCategory,
    attendancePercentage: input.attendancePercentage,
    assignmentCompletionPercentage: input.assignmentCompletionPercentage,
    pendingAssignments: input.pendingAssignments,
    subjectAnalyses: input.subjectAnalyses?.map(s => ({
      name: s.subjectName,
      risk: s.riskLevel,
      grade: s.gradeCategory,
      attendance: s.subjectAttendancePercentage
    }))
  };

  try {
    const response = await openrouter.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a helpful, extremely easy-to-understand academic advisor. 
          Analyze the student metrics and provide personalized advice.
          Keep the tone encouraging and supportive.
          CRITICAL: You MUST write your response using very simple, plain English (8th-grade reading level). Avoid dense paragraphs, avoid academic jargon, and avoid complex vocabulary. Speak directly to the student.`
        },
        {
          role: "user",
          content: `Student Metrics:\n${JSON.stringify(promptData, null, 2)}
          
Strictly follow the JSON structure. 
For Academic, Behavioral, and Intervention, write a clear, supportive 2-3 sentence paragraph. 
First, explain why this advice or praise is needed using their specific numbers (e.g., "Because your attendance is an excellent 100%..."). 
Then, provide direct, simple steps to improve OR to keep up the great work. 
CRITICAL: DO NOT use labels like "The Why", "What to do now", numbering (1., 2.), or markdown bold symbols (**). Use plain, simple text only.

For subjectRecommendations, provide 1 very simple sentence.`
        }
      ],
      response_format: zodResponseFormat(PersonalizedRecommendationsOutputSchema, "recommendations"),
      temperature: 0.7,
    });

    const outputContent = response.choices[0]?.message?.content;
    if (outputContent) {
         // The OpenAI SDK with zodResponseFormat guarantees a stringified JSON matching the schema
         const parsedOptions = JSON.parse(outputContent);
         return parsedOptions as PersonalizedRecommendationsOutput;
    } else {
        throw new Error("AI returned empty output");
    }

  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    
    // Fallback deterministic logic if API fails or key is missing
    return {
      academicRecommendations: "Based on the provided metrics, please review all core topics and prioritize completing pending assignments immediately.",
      behavioralRecommendations: "Attendance and assignment completion are critical factors. Ensure you attend all upcoming classes.",
      interventionRecommendations: input.riskLevel === 'High' ? "Mandatory intervention required. Meet with your advisor." : "Continue monitoring your progress.",
      subjectRecommendations: input.subjectAnalyses?.map(sub => ({
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        recommendation: `Focus on improving your understanding of ${sub.subjectName}.`
      })) || []
    };
  }
}
