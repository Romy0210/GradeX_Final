'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react";
import { type Student } from "@/lib/data";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signInWithEmailAndPassword, deleteUser } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

interface StudentDataContextType {
  students: Student[];
  addStudent: (newStudent: Student) => Promise<Student | undefined>;
  addStudents: (newStudents: Student[]) => Promise<void>;
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
 * This provider acts as the central "database" for student data,
 * using Firebase Firestore for persistence. It uses onSnapshot for
 * real-time sync, ensuring all components have a consistent view
 * of the student records.
 * 
 * Role-aware querying:
 *  - Admin users: fetch ALL students
 *  - Student users: fetch only their own record (by email)
 */
export function StudentDataProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, userProfile, isLoading: isUserLoading } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [analyzingStudentId, setAnalyzingStudentId] = useState<string | null>(null);

  // Real-time listener — adapts query based on user role
  useEffect(() => {
    if (!firestore || isUserLoading || !user) return;

    const isAdmin = userProfile?.role === 'admin';

    const q = isAdmin
      ? collection(firestore, "students")
      : query(collection(firestore, "students"), where("authUid", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const studentData: Student[] = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        })) as Student[];
        setStudents(studentData);
      },
      (error) => {
        console.error("Error listening to students collection:", error);
      }
    );

    return () => unsubscribe();
  }, [firestore, user, userProfile, isUserLoading]);

  /**
   * Adds a single new student to Firestore, AND creates a corresponding
   * Firebase Authentication user.
   */
  const addStudent = useCallback(async (newStudent: Student): Promise<Student | undefined> => {
    if (!firestore) throw new Error("Firestore not initialized");

    try {
      // 1. Initialize a secondary Firebase App to avoid logging out the current Admin
      const secondaryApp = getApps().find(app => app.name === "SecondaryApp")
        || initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Query Firestore first to ensure the email doesn't already exist in the database
      const q = query(collection(firestore, "students"), where("email", "==", newStudent.email));
      const existingDocs = await getDocs(q);
      if (!existingDocs.empty) {
        throw new Error("firestore/email-already-exists");
      }

      let authUid: string;
      const defaultPassword = "123456790";

      // 3. Check if the email is already in use in Authentication
      const methods = await fetchSignInMethodsForEmail(secondaryAuth, newStudent.email);
      if (methods.length > 0) {
        // Auth account exists but Firestore doc does NOT. This is an ORPHANED account.
        // We will attempt to "re-adopt" it by signing in to retrieve its UID.
        try {
          const userCredential = await signInWithEmailAndPassword(secondaryAuth, newStudent.email, defaultPassword);
          authUid = userCredential.user.uid;
        } catch (e) {
          // If the password was changed by the student before deletion, we cannot re-adopt it easily client-side.
          throw new Error("auth/email-already-in-use");
        }
      } else {
        // 4. Create a fresh Auth user
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          newStudent.email,
          defaultPassword
        );
        authUid = userCredential.user.uid;
      }

      // 5. Keep the provided Roll Number (newStudent.id) as the Document ID,
      // but store the generated Auth UID as a separate field for linking.
      const studentToSave: Student = {
        ...newStudent,
        authUid: authUid, // CRITICAL: Store the Auth UID for future reference
      };

      // 6. Save to Firestore at students/{rollNumber}
      await setDoc(doc(firestore, "students", newStudent.id), studentToSave);

      return studentToSave; // Return the full student object including generated authUid

    } catch (error: any) {
      console.error("Error adding student with auth:", error);
      throw error; // Let the UI handle the error (e.g., show a toast)
    }
  }, [firestore]);

  /**
   * Adds multiple students to Firestore using a batch write,
   * AND creates a corresponding Firebase Authentication user for each.
   */
  const addStudents = useCallback(async (newStudents: Student[]) => {
    if (!firestore) return;
    try {
      const secondaryApp = getApps().find(app => app.name === "SecondaryApp")
        || initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      const defaultPassword = "123456790";

      const batch = writeBatch(firestore);

      for (const student of newStudents) {
        let authUid: string;

        // Check if the email is already in use
        const methods = await fetchSignInMethodsForEmail(secondaryAuth, student.email);
        if (methods.length > 0) {
          try {
            const userCredential = await signInWithEmailAndPassword(secondaryAuth, student.email, defaultPassword);
            authUid = userCredential.user.uid;
          } catch (e) {
            console.warn(`Could not re-authenticate existing user for ${student.email}. Skipping auth creation.`, e);
            // If we absolutely cannot get the UID client-side, we fall back to a placeholder or fail.
            // For now, we'll try to keep the student record anyway, but they might not be able to log in.
            authUid = "unknown-auth-uid";
          }
        } else {
          // Create new user
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            student.email,
            defaultPassword
          );
          authUid = userCredential.user.uid;
        }

        const studentToSave: Student = {
          ...student,
          authUid: authUid,
        };

        const docRef = doc(firestore, "students", studentToSave.id);
        batch.set(docRef, studentToSave);
      }

      await batch.commit();
    } catch (error) {
      console.error("Error adding students in bulk:", error);
      throw error; // Re-throw so the UI can catch and toast it
    }
  }, [firestore]);

  /**
   * Updates an existing student's record in Firestore.
   */
  const updateStudent = useCallback(async (updatedStudent: Student) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, "students", updatedStudent.id), updatedStudent, { merge: true });
    } catch (error) {
      console.error("Error updating student:", error);
    }
  }, [firestore]);

  /**
   * Deletes a student from Firestore by their ID.
   */
  const deleteStudent = useCallback(async (studentId: string) => {
    if (!firestore) return;
    try {
      // 1. Get the student's email before deleting their document
      const studentToDelete = students.find((s) => s.id === studentId);

      // 2. CRITICAL: Delete the Firestore document FIRST.
      // Why? Because interacting with Auth (even on a SecondaryApp) can sometimes 
      // trigger global `onAuthStateChanged` events that unmount the current component 
      // before the function finishes. We MUST guarantee Firestore deletion.
      await deleteDoc(doc(firestore, "students", studentId));

      // 3. Perform best-effort Auth deletion
      if (studentToDelete?.email) {
        try {
          const secondaryApp = getApps().find(app => app.name === "SecondaryApp")
            || initializeApp(firebaseConfig, "SecondaryApp");
          const secondaryAuth = getAuth(secondaryApp);

          const defaultPassword = "123456790";
          const userCredential = await signInWithEmailAndPassword(secondaryAuth, studentToDelete.email, defaultPassword);
          if (userCredential.user) {
            await deleteUser(userCredential.user);
          }
        } catch (authError) {
          console.warn("Could not delete Auth account (perhaps password was changed by student):", authError);
        }
      }
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  }, [firestore, students]);

  const findStudentById = useCallback(
    (id: string): Student | undefined => {
      return students.find((student) => student.id === id);
    },
    [students]
  );

  /**
   * Clears all student data from Firestore by deleting every document
   * in the students collection.
   */
  const clearStudentData = useCallback(async () => {
    if (!firestore) return;
    try {
      const snapshot = await getDocs(collection(firestore, "students"));
      const batch = writeBatch(firestore);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing student data:", error);
    }
  }, [firestore]);

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
