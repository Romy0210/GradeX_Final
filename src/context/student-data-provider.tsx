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
const DATA_VERSION = 5; // Increment this version to force a data refresh

interface StudentDataContextType {
  students: Student[];
  addStudent: (newStudent: Student) => void;
  addStudents: (newStudents: Student[]) => void;
  updateStudent: (updatedStudent: Student) => void;
  deleteStudent: (studentId: string) => void;
  findStudentById: (id: string) => Student | undefined;
  studentCount: number;
  clearStudentData: () => void;
  analyzingStudentId: string | null;
  setAnalyzingStudentId: (id: string | null) => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

/**
 * This provider acts as the central in-memory "database" for student data,
 * using localStorage for persistence across sessions. It ensures that all
 * components have a consistent, real-time view of the student records.
 */
export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [isClient, setIsClient] = useState(false);
  const [analyzingStudentId, setAnalyzingStudentId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to load data from localStorage on initial client-side render.
  useEffect(() => {
    if (isClient) {
      try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
          const storedData = JSON.parse(item);
          // If data version is old, re-seed with fresh initial data.
          if (storedData.version !== DATA_VERSION) {
            const newData = { version: DATA_VERSION, students: initialStudents };
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setStudents(initialStudents);
          } else {
            setStudents(storedData.students);
          }
        } else {
          // If no data exists, initialize localStorage.
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

  // Effect to save data to localStorage whenever the students array changes.
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
  
  /**
   * Adds a single new student to the "database".
   * In a full-stack app, this function would be replaced by an API call
   * to a backend service that persists the student and creates their auth credentials.
   */
  const addStudent = useCallback((newStudent: Student) => {
    setStudents((prevStudents) => [...prevStudents, newStudent]);
  }, []);

  /**
   * Adds multiple students to the "database". Used for bulk uploads.
   */
  const addStudents = useCallback((newStudents: Student[]) => {
    setStudents((prevStudents) => [...prevStudents, ...newStudents]);
  }, []);

  /**
   * Updates an existing student's record in the "database".
   */
  const updateStudent = useCallback((updatedStudent: Student) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  }, []);

  /**
   * Deletes a student from the "database" by their ID.
   */
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
    analyzingStudentId,
    setAnalyzingStudentId,
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
