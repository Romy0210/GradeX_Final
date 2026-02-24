'use server';

/**
 * @fileOverview
 * Runs a full analysis on a student's performance to predict risk,
 * outcome, grade, and confidence, including subject-wise breakdown.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/* ===============================
   1. INPUT SCHEMA
================================ */

const RunStudentAnalysisInputSchema = z.object({
  gpa: z.number().describe('GPA out of 10'),
  attendancePercentage: z.number().describe('Attendance Percentage (%)'),
  assignmentCompletionPercentage: z.number().describe('Overall Assignment Completion Percentage (%)'),
  pendingAssignments: z.number().describe('Total Number of Pending Assignments'),
  overallAverageMarkPercentage: z.number().describe('Overall Average Mark Percentage'),
  subjects: z.array(z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    internalMark1: z.number(),
    internalMark2: z.number(),
    totalAssignments: z.number(),
    completedAssignments: z.number(),
    subjectAttendancePercentage: z.number().optional(),
  })).optional(),
  highRiskThreshold: z.number().optional(),
  lowRiskThreshold: z.number().optional(),
});

export type RunStudentAnalysisInput = z.infer<
  typeof RunStudentAnalysisInputSchema
>;

/* ===============================
   2. OUTPUT SCHEMA
================================ */

const SubjectAnalysisOutputSchema = z.object({
    subjectId: z.string().describe("The unique identifier for the subject."),
    subjectName: z.string().describe("The name of the subject."),
    riskLevel: z.enum(['Low', 'Medium', 'High']).describe("The predicted risk level for this subject."),
    outcome: z.enum(['Pass', 'Fail']).describe("The predicted outcome for this subject."),
    gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).describe("The predicted grade for this subject."),
});

const RunStudentAnalysisOutputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  outcome: z.enum(['Pass', 'Fail']),
  gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
  predictionConfidence: z.number().optional(),
  failureRiskProbability: z.number().optional(),
  subjectAnalyses: z.array(SubjectAnalysisOutputSchema).optional().describe("An array of AI analyses for each individual subject."),
});

export type RunStudentAnalysisOutput = z.infer<
  typeof RunStudentAnalysisOutputSchema
>;

/* ===============================
   3. EXPORTED FUNCTION
   (This is what your API/UI calls)
================================ */

export async function runStudentAnalysis(
  input: RunStudentAnalysisInput
): Promise<RunStudentAnalysisOutput> {
  return runStudentAnalysisFlow(input);
}

/* ===============================
   4. PROMPT DEFINITION
================================ */

const prompt = ai.definePrompt({
  name: 'runStudentAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: RunStudentAnalysisInputSchema },
  output: { schema: RunStudentAnalysisOutputSchema },
  prompt: `
You are an expert academic analytics AI. Your task is to perform a deterministic analysis based on a strict set of rules.
Return ONLY valid JSON that matches the output schema. No explanations.

**PART 1: OVERALL STUDENT ANALYSIS**

**OVERALL STUDENT DATA:**
- GPA (out of 10): {{gpa}}
- Overall Average Mark Percentage: {{overallAverageMarkPercentage}}%
- Overall Assignment Completion Percentage: {{assignmentCompletionPercentage}}%
- Overall Avg. Attendance Percentage: {{attendancePercentage}}%

**OVERALL RULES (Apply in order):**

1.  **NORMALIZE INPUTS:**
    *   **A. Normalized Attendance Score:** Apply this mapping to 'attendancePercentage':
        *   \`> 90%\` -> 100
        *   \`86-90%\` -> 95
        *   \`81-85%\` -> 90
        *   \`76-80%\` -> 85
        *   \`<= 75%\` -> 80
    *   **B. Normalized Assignment Score:** Apply this mapping to 'assignmentCompletionPercentage':
        *   \`100%\` -> 100
        *   \`80-99%\` -> 95
        *   \`60-79%\` -> 85
        *   \`40-59%\` -> 75
        *   \`< 40%\` -> 60

2.  **CALCULATE COMPOSITE SCORE:**
    *   \`Composite Score = (overallAverageMarkPercentage * 0.5) + (Normalized Assignment Score * 0.25) + (Normalized Attendance Score * 0.25)\`

3.  **DETERMINE INITIAL GRADE:**
    *   Assign a grade based on the \`Composite Score\` using these bands:
        *   \`90-100\`: 'S'
        *   \`85-89\`: 'A+'
        *   \`80-84\`: 'A'
        *   \`75-79\`: 'B+'
        *   \`70-74\`: 'B'
        *   \`65-69\`: 'C+'
        *   \`60-64\`: 'C'
        *   \`55-59\`: 'D'
        *   \`< 55\`: 'F'

4.  **ADJUST GRADE WITH GPA:**
    *   If \`gpa < 6.0\`, downgrade the grade by one level (e.g., 'B' becomes 'C+').
    *   If \`gpa >= 9.0\`, upgrade the grade by one level (e.g., 'B' becomes 'B+').
    *   The final grade cannot go below 'F' or above 'S'.

5.  **DETERMINE FINAL RISK LEVEL (FROM GRADE):**
    *   Based on the FINAL adjusted grade, set \`riskLevel\`:
        *   Grades 'S', 'A+', 'A' -> \`Low\`
        *   Grades 'B+', 'B', 'C+', 'C', 'D' -> \`Medium\`
        *   Grade 'F' -> \`High\`

6.  **DETERMINE FINAL OUTCOME (FROM GRADE):**
    *   Based on the FINAL adjusted grade, set \`outcome\`:
        *   Grade 'F' -> \`Fail\`
        *   All other grades -> \`Pass\`

7.  **CONFIDENCE:**
    *   If \`outcome\` is 'Pass', return \`predictionConfidence\` (0-100).
    *   If \`outcome\` is 'Fail', return \`failureRiskProbability\` (0-100).


**PART 2: SUBJECT-WISE ANALYSIS**
{{#if subjects}}
For each subject in the 'subjects' array, perform a separate analysis using the rules below.

{{#each subjects}}
---
**SUBJECT TO ANALYZE:**
- subjectId: "{{subjectId}}"
- subjectName: "{{subjectName}}"
- internalMark1: {{internalMark1}}
- internalMark2: {{internalMark2}}
- totalAssignments: {{totalAssignments}}
- completedAssignments: {{completedAssignments}}
- subjectAttendancePercentage: {{subjectAttendancePercentage}}%

**SUBJECT-WISE RULES (Apply in order):**
1.  **CALCULATE & NORMALIZE SUBJECT INPUTS:**
    *   **A. Subject Average Mark Percentage:** \`((internalMark1 + internalMark2) / 80) * 100\`.
    *   **B. Normalized Subject Attendance Score:** Apply the same mapping as the overall analysis to \`subjectAttendancePercentage\`.
    *   **C. Normalized Subject Assignment Score:**
        *   If \`totalAssignments\` is 5, use this mapping based on \`completedAssignments\`: \`5 -> 100\`, \`4 -> 95\`, \`3 -> 85\`, \`2 -> 75\`, \`< 2 -> 60\`.
        *   If \`totalAssignments\` is not 5, calculate completion percentage \`(completedAssignments / totalAssignments) * 100\` and use the **Normalized Assignment Score** map from the overall analysis.

2.  **CALCULATE SUBJECT COMPOSITE SCORE:**
    *   \`Subject Composite Score = (Subject Average Mark Percentage * 0.6) + (Normalized Subject Assignment Score * 0.2) + (Normalized Subject Attendance Score * 0.2)\`

3.  **DETERMINE SUBJECT GRADE:**
    *   Assign a grade based on the \`Subject Composite Score\` using the same grade bands as the overall analysis. There is NO GPA adjustment for subject grades.

4.  **DETERMINE SUBJECT RISK LEVEL (FROM GRADE):**
    *   \`S\`, \`A+\`, \`A\` -> \`Low\`
    *   \`B+\`, \`B\`, \`C+\`, \`C\`, \`D\` -> \`Medium\`
    *   \`F\` -> \`High\`

5.  **DETERMINE SUBJECT OUTCOME (FROM GRADE):**
    *   \`F\` -> \`Fail\`
    *   All other grades -> \`Pass\`
---
{{/each}}
{{/if}}

Return ONLY JSON.
`,
});

/* ===============================
   5. FLOW DEFINITION
   (This actually runs the AI)
================================ */

const runStudentAnalysisFlow = ai.defineFlow(
  {
    name: 'runStudentAnalysisFlow',
    inputSchema: RunStudentAnalysisInputSchema,
    outputSchema: RunStudentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
