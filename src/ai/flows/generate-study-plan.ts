'use server';

/**
 * @fileOverview Generates a personalized and structured 1-week study plan for a student.
 *
 * - generateStudyPlan - A function that generates a detailed 1-week study plan.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
 */

import { z } from 'zod';

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
  studyPlan: z.string().describe('A detailed, personalized 1-week study plan in Markdown format.'),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  // 1. Sort subjects by risk level (High > Medium > Low) then by performance
  const riskOrder: Record<string, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
  const sortedSubjects = [...input.subjects].sort((a, b) => {
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    if (a.averageMarkPercentage !== b.averageMarkPercentage) {
      return a.averageMarkPercentage - b.averageMarkPercentage; // Ascending: lowest marks first
    }
    return b.pendingAssignments - a.pendingAssignments; // Descending: highest pending assignments first
  });

  const highRiskSubjects = sortedSubjects.filter(s => s.riskLevel === 'High');
  const mediumRiskSubjects = sortedSubjects.filter(s => s.riskLevel === 'Medium');
  const lowRiskSubjects = sortedSubjects.filter(s => s.riskLevel === 'Low');

  const subjectsToFocus = [...highRiskSubjects, ...mediumRiskSubjects];

  // --- PART 1: INTRODUCTORY ANALYSIS ---

  // # Performance Diagnosis
  let performanceAdjective = "moderate";
  if (input.gpa >= 8.0) performanceAdjective = "strong";
  else if (input.gpa < 6.5) performanceAdjective = "concerning";

  let specificConcerns = "";
  if (highRiskSubjects.length > 0) {
    const names = highRiskSubjects.map(s => s.subjectName).join(" and ");
    specificConcerns = ` Specifically, performance in ${names} requires immediate attention.`;
  } else if (input.pendingAssignments > 0 || input.attendancePercentage < 85) {
    specificConcerns = ` While subject grades are stable, ${input.pendingAssignments > 0 ? "pending assignments" : ""} ${input.pendingAssignments > 0 && input.attendancePercentage < 85 ? "and" : ""} ${input.attendancePercentage < 85 ? "lower attendance" : ""} are impacting your overall stability.`;
  }

  const performanceDiagnosis = `# Performance Diagnosis\n\n${input.name} is currently performing at a ${performanceAdjective} academic level with a GPA of ${input.gpa} and an average mark of ${input.overallAverageMarkPercentage}%.${specificConcerns} You are categorized as ${input.riskLevel} risk. Addressing these gaps early using this targeted 1-week plan can significantly improve your academic stability.`;

  // # Subject-Specific Recovery Plan
  let recoveryPlan = "\n\n# Subject-Specific Recovery Plan\n\n";
  if (subjectsToFocus.length > 0) {
    subjectsToFocus.forEach(sub => {
      recoveryPlan += `## ${sub.subjectName} (${sub.riskLevel} Risk)\n`;
      recoveryPlan += `**Improvement Strategy:** Dedicate focused blocks to review core concepts, clear any backlog, and practice past problems.\n`;
      recoveryPlan += `**Micro Tasks:**\n`;
      recoveryPlan += `- Review latest lecture notes to identify immediate knowledge gaps.\n`;
      recoveryPlan += `- Solve 3-5 practice problems related to recent topics.\n`;
      if (sub.pendingAssignments > 0) {
        recoveryPlan += `- Complete ${sub.pendingAssignments} pending assignment(s) for ${sub.subjectName}.\n`;
      }
      recoveryPlan += `- Revise key concepts from the syllabus.\n\n`;
    });
  } else {
    recoveryPlan += `Excellent work! You have no high or medium risk subjects. Keep utilizing your current study techniques to maintain your strong performance.\n\n`;
  }

  // # Assignment Completion Plan
  let assignmentPlan = "\n# Assignment Completion Plan\n\n";
  if (input.pendingAssignments > 0) {
    assignmentPlan += `You have **${input.pendingAssignments}** pending assignments. Strategy:\n`;
    assignmentPlan += `- Prioritize assignments for high-risk subjects first.\n`;
    assignmentPlan += `- Break down larger assignments into smaller, 30-minute tasks.\n`;
    assignmentPlan += `- Aim to complete at least one assignment every one or two days based on deadlines.\n`;
  } else {
    assignmentPlan += `Great job! You have 0 pending assignments. Continue submitting future assignments on time.\n`;
  }

  // # Attendance Recovery Plan
  let attendancePlan = "";
  if (input.attendancePercentage < 85) {
    attendancePlan = `\n# Attendance Recovery Plan\n\nYour attendance is currently at **${input.attendancePercentage}%**, which is below optimal levels.\n`;
    attendancePlan += `- Attend all upcoming lectures without fail.\n`;
    attendancePlan += `- Request notes from peers for any missed sessions.\n`;
    attendancePlan += `- Participate actively in class discussions to rebuild engagement.\n`;
  }

  // # GPA Recovery Projection
  let possibleNewGPA = Math.min((input.gpa + 0.5), 10).toFixed(1);
  let possibleNewRisk = input.riskLevel === 'High' ? 'Medium' : 'Low';

  let gpaProjection = `\n# GPA Recovery Projection\n\nFollowing this study plan consistently can gradually improve academic performance. Maintaining consistent study sessions and improving attendance may help raise your GPA from **${input.gpa}** to a stronger range (potentially ~${possibleNewGPA}) while lowering your academic risk level to **${possibleNewRisk}**.`;


  // --- PART 2: WEEKLY SCHEDULE ---

  let schedule = "\n\n# Weekly Study Schedule\n\n";

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Distribute focus subjects
  days.forEach((day, index) => {
    // Pick a subject to focus on (round-robin through sorted subjects)
    const focusSubject = sortedSubjects.length > 0 ? sortedSubjects[index % sortedSubjects.length] : null;

    schedule += `### ${day}\n`;
    if (focusSubject) {
      schedule += `- **Study ${focusSubject.subjectName}:** Review lecture notes and core concepts for 45 minutes.\n`;
      if (focusSubject.pendingAssignments > 0) {
        schedule += `- Complete 1 pending assignment for ${focusSubject.subjectName}.\n`;
      } else {
        schedule += `- Solve practice problems or revise previous internal exam mistakes.\n`;
      }
    } else {
      schedule += `- Independent study session: Read ahead for upcoming lectures.\n`;
    }

    if (input.pendingAssignments > 0 && index % 2 === 0 && (!focusSubject || focusSubject.pendingAssignments === 0)) {
      schedule += `- Spend 30 minutes working on other pending assignments.\n`;
    }

    schedule += `- Take a short 15-minute break to recharge.\n\n`;
  });

  // Sunday
  schedule += `### Sunday\n`;
  schedule += `- **Light Revision:** Briefly review the topics covered this week (30 minutes max).\n`;
  schedule += `- **Rest & Recover:** Take time off from heavy studying to relax and prepare for the upcoming week.\n`;


  const fullMarkdown = `${performanceDiagnosis}${recoveryPlan}${assignmentPlan}${attendancePlan}${gpaProjection}${schedule}`;

  return GenerateStudyPlanOutputSchema.parse({
    studyPlan: fullMarkdown
  });
}
