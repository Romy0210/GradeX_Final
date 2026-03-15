'use server';

/**
 * @fileOverview Generates a personalized and structured 1-week study plan for a student.
 *
 * - generateStudyPlan - A function that generates a detailed 1-week study plan.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
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

const SubjectPerformanceSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  outcome: z.enum(['Pass', 'Fail']),
  gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
  averageMarkPercentage: z.number(),
  subjectAttendancePercentage: z.number(),
  pendingAssignments: z.number(),
});

const GenerateStudyPlanInputSchema = z.object({
  name: z.string().describe("The student's name."),
  gpa: z.number().describe('The GPA of the student (out of 10).'),
  pendingAssignments: z.number().describe('The number of pending assignments.'),
  attendancePercentage: z.number().describe("The student's overall attendance percentage."),
  gradeCategory: z.string().describe('The predicted grade category for the student.'),
  overallAverageMarkPercentage: z.number().describe('The overall average mark percentage of the student.'),
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe("The student's risk level."),
  subjects: z.array(SubjectPerformanceSchema).describe("The student's subject-wise performance data.")
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const GenerateStudyPlanOutputSchema = z.object({
  studyPlan: z.string().describe('A detailed, highly personalized 1-week study schedule rendered in beautifully formatted Markdown.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {

  // For privacy, strip the student's real name before sending
  const anonymizedData = {
    gpa: input.gpa,
    pendingAssignments: input.pendingAssignments,
    attendancePercentage: input.attendancePercentage,
    overallAverageMarkPercentage: input.overallAverageMarkPercentage,
    riskLevel: input.riskLevel,
    subjects: input.subjects.map(s => ({
      name: s.subjectName,
      risk: s.riskLevel,
      grade: s.gradeCategory,
      marks: s.averageMarkPercentage,
      attendance: s.subjectAttendancePercentage,
      pendingTasks: s.pendingAssignments
    }))
  };

  try {
    const response = await openrouter.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert AI academic tutor. Generate a highly personalized 1-week study schedule (Monday-Sunday) in elegant Markdown format based on this student's statistical profile.`
        },
        {
          role: "user",
          content: `Student Profile:\n${JSON.stringify(anonymizedData, null, 2)}\n\nRequirements for the Markdown Study Plan:\n1. Start with a "Performance Diagnosis" paragraph.\n2. Include a "Subject-Specific Recovery Plan" for any subjects marked "Medium" or "High" risk.\n3. Include an "Assignment Completion Plan" if there are pending tasks.\n4. Detail the actual "Weekly Schedule" (Monday-Sunday) breaking down exact focus blocks (e.g. 45 mins).\n5. End with a "GPA Recovery Projection" paragraph.\n\nUse the word "You" to address the student directly. Make it actionable, supportive, and mathematically grounded in the provided metrics. Do NOT use any real names. Return ONLY a valid JSON object matching the requested schema.`
        }
      ],
      response_format: zodResponseFormat(GenerateStudyPlanOutputSchema, "study_plan"),
      temperature: 0.7,
    });

    const outputContent = response.choices[0]?.message?.content;
    if (outputContent) {
      const parsedOutput = JSON.parse(outputContent) as GenerateStudyPlanOutput;
      
      // Re-inject the student's real name locally
      let customizedMarkdown = parsedOutput.studyPlan;
      customizedMarkdown = customizedMarkdown.replace(/# Performance Diagnosis\n\n(You|The student)/i, `# Performance Diagnosis\n\n${input.name}, you`);
      
      return { studyPlan: customizedMarkdown };
    } else {
      throw new Error("AI returned empty output");
    }

  } catch (error) {
    console.error("Error generating Study Plan:", error);
    
    // Fallback deterministic logic 
    const fallbackDaySchedule = `### Monday-Friday\n- 45m: Focus on High Risk Subjects\n- 30m: Complete pending assignments\n- 15m: Review notes for tomorrow\n\n### Weekend\n- Rest and complete larger projects.`;
    return {
      studyPlan: `# Performance Diagnosis\n\n${input.name}, you are currently at a ${input.riskLevel} risk level with a GPA of ${input.gpa}. Please focus on completing your ${input.pendingAssignments} pending assignments immediately.\n\n# Weekly Schedule\n\n${fallbackDaySchedule}`
    };
  }
}
