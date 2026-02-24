'use server';

/**
 * @fileOverview Generates a personalized and structured 1-week study plan for a student.
 *
 * - generateStudyPlan - A function that generates a detailed 1-week study plan.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  studyPlan: z.string().describe('A detailed, personalized 1-week study plan in Markdown format. The plan should be encouraging, actionable, and follow a specific structure for parsing.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: {schema: GenerateStudyPlanInputSchema},
  output: {schema: GenerateStudyPlanOutputSchema},
  prompt: `You are an expert academic coach creating a personalized 1-week study plan for {{name}}.

  **Student Data:**
  - Name: {{name}}
  - Current GPA: {{gpa}}
  - Average Mark: {{overallAverageMarkPercentage}}%
  - Grade Prediction: {{gradeCategory}}
  - Overall Pending Assignments: {{pendingAssignments}}
  - Overall Attendance: {{attendancePercentage}}%
  - Overall Risk Level: {{riskLevel}}
  - Subjects (prioritized by risk and performance):
  {{#each subjects}}
    - Subject: {{subjectName}}
      - Risk Level: {{riskLevel}}
      - Grade: {{gradeCategory}}
      - Average Mark: {{averageMarkPercentage}}%
      - Attendance: {{subjectAttendancePercentage}}%
      - Pending Assignments: {{pendingAssignments}}
  {{/each}}
  
  **Instructions:**
  Generate a single, detailed markdown string. The plan must be structured into two parts: an introductory analysis, and a day-by-day schedule. The final output must be easily parsable.
  
  **Part 1: Introductory Analysis (Everything before the first '###')**
  This section should contain the following, with markdown formatting (e.g., bolding, bullet points).
  1.  **# Performance Diagnosis:** A supportive paragraph explaining why the student is at their current risk level. Mention specific habits (like low attendance or pending assignments) and which subjects are most impactful.
  2.  **# Subject-Specific Recovery Plan:** For each high and medium risk subject, create a sub-section (e.g., \`## Data Structures (High Risk)\`) with a brief "Improvement Strategy" and a list of 3-4 "Micro Tasks".
  3.  **# Assignment Completion Plan:** Provide a clear, actionable strategy to tackle the {{pendingAssignments}} pending assignments.
  4.  **# Attendance Recovery Plan:** (ONLY if overall attendance is below 85%) Provide specific steps to improve attendance.
  5.  **# GPA Recovery Projection:** Give an encouraging projection of how following the plan could improve their GPA and risk level (e.g., "Following this plan could potentially raise your GPA from {{gpa}} to a healthier range and lower your risk from {{riskLevel}} to Medium.").
  
  **Part 2: 7-Day Structured Schedule**
  Create a schedule for each day from Monday to Sunday. Each day **MUST** start with a \`### \` header (e.g., \`### Monday: Focus on Data Structures\`).
  - For each day, create a bulleted list of 2-3 specific, manageable tasks that draw from the "Micro Tasks" you defined earlier.
  - Prioritize tasks from high-risk subjects early in the week.
  - Incorporate study sessions, assignment work, and revision.
  - Include short breaks and a rest day (Sunday).
  - The tone should be supportive and positive. Address the student by name.
  `,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    // Sort subjects by risk level (High > Medium > Low) then by performance
    const riskOrder: Record<string, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
    const sortedSubjects = [...input.subjects].sort((a, b) => {
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
            return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        if (a.averageMarkPercentage !== b.averageMarkPercentage) {
            return a.averageMarkPercentage - b.averageMarkPercentage;
        }
        return b.pendingAssignments - a.pendingAssignments;
    });

    const sortedInput = {...input, subjects: sortedSubjects };

    const {output} = await prompt(sortedInput);
    return output!;
  }
);
