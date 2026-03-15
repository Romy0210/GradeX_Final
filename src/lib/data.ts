export type StudentSubject = {
  subjectId: string;
  subjectName: string;
  internalMark1: number;
  internalMark2: number;
  totalAssignments: number;
  completedAssignments: number;
  subjectAttendancePercentage: number;
};

export type StudentSubjectAnalysis = {
  subjectId: string;
  subjectName: string;
  riskLevel: "Low" | "Medium" | "High";
  outcome: "Pass" | "Fail";
  gradeCategory: "S" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
};

export type StudentSubjectRecommendation = {
  subjectId: string;
  subjectName: string;
  recommendation: string;
};

export type Student = {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  email: string;
  phone: string;
  bloodGroup: string;
  profilePhoto: string;
  educationalBackground: string;
  batch: string;
  class: string;
  semester: string;
  gpa: number;
  subjects: StudentSubject[];
  overallAverageMarkPercentage: number;
  attendancePercentage: number;
  assignmentCompletion: number;
  assignmentCompletionPercentage: number;
  pendingAssignments: number;
  riskLevel: "Low" | "Medium" | "High";
  outcome: "Pass" | "Fail";
  gradeCategory: "S" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  predictionConfidence?: number;
  failureRiskProbability?: number;
  academicRecommendations?: string;
  behavioralRecommendations?: string;
  interventionRecommendations?: string;
  subjectAnalyses?: StudentSubjectAnalysis[];
  subjectRecommendations?: StudentSubjectRecommendation[];
  authUid?: string;
  studyPlan?: string;
};

export const students: Student[] = [];
