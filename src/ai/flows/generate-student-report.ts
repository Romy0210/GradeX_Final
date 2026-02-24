'use server';

/**
 * @fileOverview Generates a comprehensive student report including predictions and recommendations.
 *
 * - generateStudentReport - A function that generates a full report for a student.
 * - GenerateStudentReportInput - The input type for the generateStudentReport function.
 * - GenerateStudentReportOutput - The return type for the generateStudentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { runStudentAnalysis } from './run-student-analysis';
import { generatePersonalizedRecommendations } from './generate-personalized-recommendations';


const RunStudentAnalysisInputSchema = z.object({
  gpa: z.number().describe('GPA out of 10'),
  attendancePercentage: z.number().describe('Attendance Percentage (%)'),
  assignmentCompletionPercentage: z.number().describe('Assignment Completion (percentage)'),
  pendingAssignments: z.number().describe('Number of Pending Assignments'),
  overallAverageMarkPercentage: z.number().describe('The overall average mark percentage of the student.'),
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
  mediumRiskThreshold: z.number().optional(),
});

const SubjectAnalysisOutputSchema = z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    riskLevel: z.enum(['Low', 'Medium', 'High']),
    outcome: z.enum(['Pass', 'Fail']),
    gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
});

const RunStudentAnalysisOutputSchema = z.object({
    riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The predicted risk level of the student.'),
    outcome: z.enum(['Pass', 'Fail']).describe('The predicted outcome for the student.'),
    gradeCategory: z.enum(['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).describe('The predicted grade category for the student.'),
    predictionConfidence: z.number().optional().describe('The prediction confidence (if outcome is Pass) as a percentage.'),
    failureRiskProbability: z.number().optional().describe('The failure risk probability (if outcome is Fail) as a percentage.'),
    subjectAnalyses: z.array(SubjectAnalysisOutputSchema).optional(),
});

const SubjectRecommendationSchema = z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    recommendation: z.string(),
});

const PersonalizedRecommendationsOutputSchema = z.object({
  academicRecommendations: z.string().describe('A paragraph of AI-driven academic recommendations for the student.'),
  behavioralRecommendations: z.string().describe('A paragraph of AI-driven behavioral recommendations for the student.'),
  interventionRecommendations: z.string().describe('A paragraph of risk-based intervention recommendations for the student.'),
  subjectRecommendations: z.array(SubjectRecommendationSchema).optional(),
});


const GenerateStudentReportInputSchema = RunStudentAnalysisInputSchema;
export type GenerateStudentReportInput = z.infer<typeof GenerateStudentReportInputSchema>;

const GenerateStudentReportOutputSchema = RunStudentAnalysisOutputSchema.merge(PersonalizedRecommendationsOutputSchema);
export type GenerateStudentReportOutput = z.infer<typeof GenerateStudentReportOutputSchema>;

export async function generateStudentReport(
  input: GenerateStudentReportInput
): Promise<GenerateStudentReportOutput> {
  return generateStudentReportFlow(input);
}


const generateStudentReportFlow = ai.defineFlow(
  {
    name: 'generateStudentReportFlow',
    inputSchema: GenerateStudentReportInputSchema,
    outputSchema: GenerateStudentReportOutputSchema,
  },
  async (input) => {
    const analysisResult = await runStudentAnalysis(input);

    const recommendationsResult = await generatePersonalizedRecommendations({
        riskLevel: analysisResult.riskLevel,
        outcome: analysisResult.outcome,
        gradeCategory: analysisResult.gradeCategory,
        academicPerformance: `GPA: ${input.gpa}, Avg Mark: ${input.overallAverageMarkPercentage}%`,
        attendancePercentage: input.attendancePercentage,
        assignmentCompletionPercentage: input.assignmentCompletionPercentage,
        pendingAssignments: input.pendingAssignments,
        subjectAnalyses: analysisResult.subjectAnalyses?.map(analysis => {
            const originalSubject = input.subjects?.find(s => s.subjectId === analysis.subjectId);
            return {
                ...analysis,
                subjectAttendancePercentage: originalSubject?.subjectAttendancePercentage
            };
        })
    });

    return {
      ...analysisResult,
      ...recommendationsResult,
    };
  }
);
