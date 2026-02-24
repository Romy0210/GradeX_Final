'use client';

import { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback, 
    ReactNode 
} from "react";
import { students as initialStudents, type Student } from "@/lib/data";

const STORAGE_KEY = "gradex-students";
const DATA_VERSION = 3; // Increment this version to force a data refresh

interface StudentDataContextType {
  students: Student[];
  addStudent: (newStudent: Student) => void;
  addStudents: (newStudents: Student[]) => void;
  updateStudent: (updatedStudent: Student) => void;
  deleteStudent: (studentId: string) => void;
  findStudentById: (id: string) => Student | undefined;
  studentCount: number;
  clearStudentData: () => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
          const storedData = JSON.parse(item);
          if (storedData.version !== DATA_VERSION) {
            const newData = { version: DATA_VERSION, students: initialStudents };
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setStudents(initialStudents);
          } else {
            setStudents(storedData.students);
          }
        } else {
          const newData = { version: DATA_VERSION, students: initialStudents };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
          setStudents(initialStudents);
        }
      } catch (error) {
        console.error("Error handling localStorage, re-seeding data.", error);
        const newData = { version: DATA_VERSION, students: initialStudents };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setStudents(initialStudents);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      try {
        const dataToStore = { version: DATA_VERSION, students: students };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    }
  }, [students, isClient]);

  const addStudent = useCallback((newStudent: Student) => {
    setStudents((prevStudents) => [...prevStudents, newStudent]);
  }, []);

  const addStudents = useCallback((newStudents: Student[]) => {
    setStudents((prevStudents) => [...prevStudents, ...newStudents]);
  }, []);

  const updateStudent = useCallback((updatedStudent: Student) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents((prevStudents) =>
      prevStudents.filter((student) => student.id !== studentId)
    );
  }, []);

  const findStudentById = useCallback(
    (id: string): Student | undefined => {
      return students.find((student) => student.id === id);
    },
    [students]
  );
  
  const clearStudentData = useCallback(() => {
    if (isClient) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      } catch (error) {
        console.error("Error clearing localStorage", error);
      }
    }
  }, [isClient]);

  const value = {
    students,
    addStudent,
    addStudents,
    updateStudent,
    deleteStudent,
    findStudentById,
    studentCount: students.length,
    clearStudentData,
  };

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
    const context = useContext(StudentDataContext);
    if (context === undefined) {
        throw new Error('useStudentData must be used within a StudentDataProvider');
    }
    return context;
}