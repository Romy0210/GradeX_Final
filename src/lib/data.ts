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

export const students: Student[] = [
  {
    id: "ST001",
    name: "Alex Johnson",
    age: 21,
    gender: "Male",
    email: "alex.j@example.com",
    phone: "123-456-7890",
    bloodGroup: "A+",
    profilePhoto: "student-1",
    educationalBackground: "High School Diploma",
    batch: "2021-2025",
    class: "Computer Science",
    semester: "6",
    gpa: 8.5,
    subjects: [
      { subjectId: "CS601", subjectName: "Data Structures", internalMark1: 35, internalMark2: 38, totalAssignments: 5, completedAssignments: 5, subjectAttendancePercentage: 95 },
      { subjectId: "CS602", subjectName: "Operating Systems", internalMark1: 32, internalMark2: 36, totalAssignments: 5, completedAssignments: 5, subjectAttendancePercentage: 98 }
    ],
    overallAverageMarkPercentage: 91.25,
    attendancePercentage: 97,
    assignmentCompletion: 10,
    assignmentCompletionPercentage: 100,
    pendingAssignments: 0,
    riskLevel: "Low",
    outcome: "Pass",
    gradeCategory: "A+",
    predictionConfidence: 98,
    academicRecommendations: "",
    behavioralRecommendations: "",
    interventionRecommendations: "",
    subjectAnalyses: [],
    subjectRecommendations: [],
  },
  {
    id: "ST002",
    name: "Maria Garcia",
    age: 20,
    gender: "Female",
    email: "maria.g@example.com",
    phone: "234-567-8901",
    bloodGroup: "O-",
    profilePhoto: "student-2",
    educationalBackground: "High School Diploma",
    batch: "2021-2025",
    class: "Computer Science",
    semester: "6",
    gpa: 6.2,
    subjects: [
      { subjectId: "CS601", subjectName: "Data Structures", internalMark1: 22, internalMark2: 25, totalAssignments: 5, completedAssignments: 2, subjectAttendancePercentage: 78 },
      { subjectId: "CS602", subjectName: "Operating Systems", internalMark1: 20, internalMark2: 21, totalAssignments: 5, completedAssignments: 1, subjectAttendancePercentage: 70 }
    ],
    overallAverageMarkPercentage: 58.75,
    attendancePercentage: 74,
    assignmentCompletion: 3,
    assignmentCompletionPercentage: 30,
    pendingAssignments: 7,
    riskLevel: "High",
    outcome: "Fail",
    gradeCategory: "D",
    failureRiskProbability: 85,
    academicRecommendations: "",
    behavioralRecommendations: "",
    interventionRecommendations: "",
    subjectAnalyses: [],
    subjectRecommendations: [],
  },
  {
    id: "ST003",
    name: "David Smith",
    age: 20,
    gender: "Male",
    email: "david.s@example.com",
    phone: "567-890-1234",
    bloodGroup: "O+",
    profilePhoto: "student-5",
    educationalBackground: "High School Diploma",
    batch: "2022-2026",
    class: "Information Technology",
    semester: "4",
    gpa: 6.8,
    subjects: [
      { subjectId: "IT401", subjectName: "Web Development", internalMark1: 25, internalMark2: 28, totalAssignments: 5, completedAssignments: 3, subjectAttendancePercentage: 82 },
      { subjectId: "IT402", subjectName: "Software Engineering", internalMark1: 22, internalMark2: 30, totalAssignments: 4, completedAssignments: 2, subjectAttendancePercentage: 85 },
    ],
    overallAverageMarkPercentage: 66.25,
    attendancePercentage: 84,
    assignmentCompletion: 5,
    assignmentCompletionPercentage: 55,
    pendingAssignments: 4,
    riskLevel: "High",
    outcome: "Fail",
    gradeCategory: "C+",
    failureRiskProbability: 70,
    academicRecommendations: "",
    behavioralRecommendations: "",
    interventionRecommendations: "",
    subjectAnalyses: [],
    subjectRecommendations: [],
  },
  {
    id: "ST004",
    name: "Sophia Chen",
    age: 21,
    gender: "Female",
    email: "sophia.c@example.com",
    phone: "789-012-3456",
    bloodGroup: "B-",
    profilePhoto: "student-4",
    educationalBackground: "High School Diploma",
    batch: "2022-2026",
    class: "Information Technology",
    semester: "4",
    gpa: 7.5,
    subjects: [
      { subjectId: "IT401", subjectName: "Web Development", internalMark1: 28, internalMark2: 30, totalAssignments: 5, completedAssignments: 4, subjectAttendancePercentage: 91 },
      { subjectId: "IT402", subjectName: "Software Engineering", internalMark1: 32, internalMark2: 31, totalAssignments: 4, completedAssignments: 4, subjectAttendancePercentage: 94 },
    ],
    overallAverageMarkPercentage: 72.5,
    attendancePercentage: 93,
    assignmentCompletion: 8,
    assignmentCompletionPercentage: 89,
    pendingAssignments: 1,
    riskLevel: "Medium",
    outcome: "Pass",
    gradeCategory: "B",
    predictionConfidence: 90,
    academicRecommendations: "",
    behavioralRecommendations: "",
    interventionRecommendations: "",
    subjectAnalyses: [],
    subjectRecommendations: [],
  },
  {
    id: "ST005",
    name: "James Wilson",
    age: 22,
    gender: "Male",
    email: "james.w@example.com",
    phone: "321-654-0987",
    bloodGroup: "AB+",
    profilePhoto: "student-3",
    educationalBackground: "High School Diploma",
    batch: "2021-2025",
    class: "Computer Science",
    semester: "6",
    gpa: 7.8,
    subjects: [
      { subjectId: "CS601", subjectName: "Data Structures", internalMark1: 30, internalMark2: 32, totalAssignments: 5, completedAssignments: 4, subjectAttendancePercentage: 88 },
      { subjectId: "CS602", subjectName: "Operating Systems", internalMark1: 28, internalMark2: 34, totalAssignments: 5, completedAssignments: 5, subjectAttendancePercentage: 90 },
    ],
    overallAverageMarkPercentage: 77.5,
    attendancePercentage: 89,
    assignmentCompletion: 9,
    assignmentCompletionPercentage: 90,
    pendingAssignments: 1,
    riskLevel: "Medium",
    outcome: "Pass",
    gradeCategory: "B+",
    predictionConfidence: 92,
    academicRecommendations: "",
    behavioralRecommendations: "",
    interventionRecommendations: "",
    subjectAnalyses: [],
    subjectRecommendations: [],
  },
];
