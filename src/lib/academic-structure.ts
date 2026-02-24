export type Subject = {
  id: string;
  name: string;
  totalAssignments: number;
};

export type SubjectConfiguration = {
  id: string; // Composite key: batch-class-semester
  batch: string;
  class: string;
  semester: string;
  subjects: Subject[];
};

export const initialSubjectConfigurations: SubjectConfiguration[] = [
  {
    id: "2021-2025-Computer Science-6",
    batch: "2021-2025",
    class: "Computer Science",
    semester: "6",
    subjects: [
      { id: "CS601", name: "Data Structures", totalAssignments: 5 },
      { id: "CS602", name: "Operating Systems", totalAssignments: 5 },
      { id: "CS603", name: "Computer Networks", totalAssignments: 4 },
      { id: "CS604", name: "Database Management", totalAssignments: 3 },
    ],
  },
  {
    id: "2022-2026-Information Technology-4",
    batch: "2022-2026",
    class: "Information Technology",
    semester: "4",
    subjects: [
        { id: "IT401", name: "Web Development", totalAssignments: 5 },
        { id: "IT402", name: "Software Engineering", totalAssignments: 4 },
        { id: "IT403", name: "Object-Oriented Programming", totalAssignments: 5 },
    ]
  },
];
