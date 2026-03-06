'use server';

/**
 * @fileOverview Generates personalized recommendations for students based on their risk level, outcome, and grade category.
 *
 * - generatePersonalizedRecommendations - A function that generates personalized recommendations for a student.
 * - PersonalizedRecommendationsInput - The input type for the generatePersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the generatePersonalizedRecommendations function.
 */

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

  // Deterministic Academic Recommendations
  let academic = "";
  if (input.riskLevel === 'High') {
    academic = "Critical: Immediate focus is required on core topics. Revise foundational materials and actively practice previous exam questions to improve internal assessment scores.";
  } else if (input.riskLevel === 'Medium') {
    academic = "Focus on consistent revision and targeted practice in areas where marks dropped. Engaging with active studying techniques will help elevate your grade category.";
  } else {
    academic = "Maintain your current excellent academic strategies. Consider exploring advanced topics or peer-tutoring to deepen your mastery of the material.";
  }

  if (input.pendingAssignments > 0) {
    academic += ` Make sure to complete your ${input.pendingAssignments} pending assignment(s) as soon as possible to secure internal marks.`;
  }

  // Deterministic Behavioral Recommendations
  let behavioral = "";
  if (input.attendancePercentage < 80) {
    behavioral = "Attendance is a significant concern. Increase class attendance immediately to ensure a consistent understanding of the course material and avoid missing critical lectures.";
  } else if (input.attendancePercentage < 90) {
    behavioral = "Your attendance is satisfactory but has room for improvement. Try to minimize absences to stay fully synchronized with the course schedule.";
  } else {
    behavioral = "Excellent attendance record. Continue this strong habit of regular participation, as it directly correlates with your high performance.";
  }

  if (input.assignmentCompletionPercentage < 75) {
    behavioral += " Additionally, build a better daily routine to improve your overall assignment completion rate.";
  }

  // Deterministic Intervention Recommendations
  let intervention = "";
  if (input.riskLevel === 'High' || input.outcome === 'Fail') {
    intervention = "Mandatory intervention: Schedule an immediate mentoring session with your academic advisor. A structured remediation plan and regular check-ins are highly recommended.";
  } else if (input.riskLevel === 'Medium') {
    intervention = "Recommended intervention: Consider scheduling a meeting with subject teachers for classes where you are struggling. Joining a study group could also be beneficial.";
  } else {
    intervention = "No serious interventions needed. Keep up the open communication with your instructors to maintain your trajectory.";
  }

  // Deterministic Subject Recommendations
  const subjectRecommendations: { subjectId: string, subjectName: string, recommendation: string }[] = [];
  if (input.subjectAnalyses) {
    for (const sub of input.subjectAnalyses) {
      let subRec = "";
      if (sub.riskLevel === 'High') {
        subRec = `Urgent attention needed for ${sub.subjectName}. Revisit the core syllabus and seek extra help from the instructor.`;
      } else if (sub.riskLevel === 'Medium') {
        subRec = `Performance in ${sub.subjectName} is average. Focus on weak topics and complete all upcoming assignments to boost your grade.`;
      } else {
        subRec = `Strong performance in ${sub.subjectName}. Continue your current study methods and aim for full marks in upcoming evaluations.`;
      }

      if ((sub.subjectAttendancePercentage ?? 100) < 80) {
        subRec += ` Also, strictly improve your attendance in this specific class.`;
      }

      subjectRecommendations.push({
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        recommendation: subRec
      });
    }
  }

  return {
    academicRecommendations: academic,
    behavioralRecommendations: behavioral,
    interventionRecommendations: intervention,
    subjectRecommendations: subjectRecommendations.length > 0 ? subjectRecommendations : undefined,
  };
}
