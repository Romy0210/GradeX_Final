'use server';

/**
 * @fileOverview
 * Runs a full analysis on a student's performance to predict risk,
 * outcome, grade, and confidence, including subject-wise breakdown.
 */

import { openrouter, MODEL } from '@/ai/genkit';
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
  subjectId: z.coerce.string().describe("The unique identifier for the subject."),
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
================================ */

export async function runStudentAnalysis(
  input: RunStudentAnalysisInput
): Promise<RunStudentAnalysisOutput> {
  // Build subject data section
  let subjectSection = '';
  if (input.subjects && input.subjects.length > 0) {
    subjectSection = `
**PART 2: SUBJECT-WISE ANALYSIS**
For each subject below, perform a separate analysis using the subject-wise rules.

${input.subjects.map(s => `---
**SUBJECT TO ANALYZE:**
- subjectId: "${s.subjectId}"
- subjectName: "${s.subjectName}"
- internalMark1: ${s.internalMark1}
- internalMark2: ${s.internalMark2}
- totalAssignments: ${s.totalAssignments}
- completedAssignments: ${s.completedAssignments}
- subjectAttendancePercentage: ${s.subjectAttendancePercentage ?? 0}%

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
---`).join('\n')}`;
  }

  const prompt = `You are an expert academic analytics AI. Your task is to perform a deterministic analysis based on a strict set of rules.
Return ONLY valid JSON that matches the output schema. No explanations.

**PART 1: OVERALL STUDENT ANALYSIS**

**OVERALL STUDENT DATA:**
- GPA (out of 10): ${input.gpa}
- Overall Average Mark Percentage: ${input.overallAverageMarkPercentage}%
- Overall Assignment Completion Percentage: ${input.assignmentCompletionPercentage}%
- Overall Avg. Attendance Percentage: ${input.attendancePercentage}%

**OVERALL RULES:**

1.  **RISK LEVEL**: Determine the risk level by following these rules in order. The first category the student falls into is their final risk level.
    *   **A. High Risk**: A student is 'High' risk if ANY of the following are true:
        *   GPA is less than ${input.highRiskThreshold ?? 6.5}
        *   Attendance Percentage is less than 80%
        *   Assignment Completion Percentage is less than 70%
        *   Pending Assignments is 3 or more
    *   **B. Low Risk**: If the student is NOT 'High' risk, they are 'Low' risk if ALL of the following are true:
        *   GPA is greater than ${input.lowRiskThreshold ?? 8.0}
        *   Attendance Percentage is 90% or greater
        *   Assignment Completion Percentage is 85% or greater
        *   Pending Assignments is 0
    *   **C. Medium Risk**: If the student is not 'High' risk and not 'Low' risk, they are 'Medium' risk.

2.  **OUTCOME**:
    *   \`Fail\` -> if RiskLevel is High
    *   \`Pass\` -> if RiskLevel is Low or Medium

3.  **GRADE** (based on Average Mark Percentage, GPA, and Risk Level):
    *   **Step 1: Base Grade (Average Mark Percentage)**
        *   \`90-100\`: 'S'
        *   \`85-89\`: 'A+'
        *   \`80-84\`: 'A'
        *   \`75-79\`: 'B+'
        *   \`70-74\`: 'B'
        *   \`65-69\`: 'C+'
        *   \`60-64\`: 'C'
        *   \`55-59\`: 'D'
        *   \`< 55\`: 'F'
    *   **Step 2: GPA Adjustment**
        *   GPA < 6.5 -> downgrade grade by 2 levels
        *   GPA 6.5-7.4 -> downgrade grade by 1 level
        *   GPA >= 8.5 -> upgrade grade by 1 level
        *   Otherwise -> no change
    *   **Step 3: Risk Level Adjustment**
        *   RiskLevel is High -> final Grade = 'F'
        *   RiskLevel is Medium -> downgrade grade by 1 level
        *   RiskLevel is Low -> no change
    *   **Step 4:** Ensure final grade is within 'S' to 'F' range.

4.  **CONFIDENCE**:
    *   If outcome is 'Pass' -> return \`predictionConfidence\` (0-100)
    *   If outcome is 'Fail' -> return \`failureRiskProbability\` (0-100)

${subjectSection}

Return ONLY JSON with this structure:
{
  "riskLevel": "Low" | "Medium" | "High",
  "outcome": "Pass" | "Fail",
  "gradeCategory": "S" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F",
  "predictionConfidence": number (optional, only if outcome is Pass),
  "failureRiskProbability": number (optional, only if outcome is Fail),
  "subjectAnalyses": [ { "subjectId": "...", "subjectName": "...", "riskLevel": "...", "outcome": "...", "gradeCategory": "..." } ] (optional, only if subjects provided)
}`;

  const completion = await openrouter.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return RunStudentAnalysisOutputSchema.parse(parsed);
}
