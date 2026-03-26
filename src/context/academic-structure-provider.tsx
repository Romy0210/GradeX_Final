'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { setDoc } from "firebase/firestore";

import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { type SubjectConfiguration, type Subject } from "@/lib/academic-structure";

interface AcademicStructureContextType {
  configurations: SubjectConfiguration[];
  getSubjectsForGroup: (batch: string, className: string, semester: string) => Subject[];
  addOrUpdateConfiguration: (config: SubjectConfiguration) => Promise<void>;
  createAcademicGroup: (group: { batch: string; class: string; semester: string }) => Promise<boolean>;
  deleteAcademicGroupsBulk: (filters: { batch?: string; class?: string; semester?: string }) => Promise<void>;
}

const AcademicStructureContext = createContext<AcademicStructureContextType | undefined>(undefined);

export function AcademicStructureProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore(); // ✅ GET FROM CONTEXT
  const [configurations, setConfigurations] = useState<SubjectConfiguration[]>([]);

  /* ==============================
     LOAD ALL CONFIGURATIONS
  ============================== */

  const { user } = useUser();

  useEffect(() => {
    if (!firestore || !user) return;

    const fetchConfigurations = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "academicGroups"));

        const data: SubjectConfiguration[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as SubjectConfiguration[];

        setConfigurations(data);
      } catch (error) {
        console.error("Error loading academic groups:", error);
      }
    };

    fetchConfigurations();
  }, [firestore]);

  /* ==============================
     GET SUBJECTS
  ============================== */

  const getSubjectsForGroup = useCallback(
    (batch: string, className: string, semester: string): Subject[] => {
      if (!batch || !className || !semester) return [];

      const configId = `${batch}-${className}-${semester}`;
      const config = configurations.find((c) => c.id === configId);

      return config ? config.subjects || [] : [];
    },
    [configurations]
  );

  /* ==============================
     ADD OR UPDATE CONFIG
  ============================== */

  const addOrUpdateConfiguration = useCallback(
    async (newConfig: SubjectConfiguration) => {
      if (!firestore) return;

      try {
        const docRef = doc(firestore, "academicGroups", newConfig.id);

        await setDoc(
  doc(firestore, "academicGroups", newConfig.id),
  {
    ...newConfig,
    updatedAt: serverTimestamp(),
  },
  { merge: true }   // ✅ VERY IMPORTANT
);

        setConfigurations((prev) => {
          const index = prev.findIndex((c) => c.id === newConfig.id);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = newConfig;
            return updated;
          }
          return [...prev, newConfig];
        });

      } catch (error) {
        console.error("Error updating configuration:", error);
      }
    },
    [firestore]
  );

  /* ==============================
     CREATE ACADEMIC GROUP
  ============================== */

  const createAcademicGroup = useCallback(
    async (group: { batch: string; class: string; semester: string }): Promise<boolean> => {
      if (!firestore) return false;

      const { batch, class: className, semester } = group;
      const configId = `${batch}-${className}-${semester}`;

      try {
        const q = query(
          collection(firestore, "academicGroups"),
          where("batch", "==", batch),
          where("class", "==", className),
          where("semester", "==", semester)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          return false;
        }

        await setDoc(
  doc(firestore, "academicGroups", configId),
  {
    batch,
    class: className,
    semester,
    subjects: [],
    createdAt: serverTimestamp(),
  }
);

        setConfigurations((prev) => [
          ...prev,
          {
            id: configId,
            batch,
            class: className,
            semester,
            subjects: [],
          },
        ]);

        return true;

      } catch (error) {
        console.error("Error creating academic group:", error);
        return false;
      }
    },
    [firestore]
  );

  /* ==============================
     DELETE ACADEMIC GROUPS BULK
  ============================== */

  const deleteAcademicGroupsBulk = useCallback(
    async (filters: { batch?: string; class?: string; semester?: string }): Promise<void> => {
      if (!firestore) return;

      const { batch: batchFilter, class: classFilter, semester: semesterFilter } = filters;
      
      // 1. Find configurations matching filters
      const toDelete = configurations.filter(c => {
        const batchMatch = !batchFilter || c.batch === batchFilter;
        const classMatch = !classFilter || c.class === classFilter;
        const semesterMatch = !semesterFilter || c.semester === semesterFilter;
        return batchMatch && classMatch && semesterMatch;
      });

      if (toDelete.length === 0) return;

      try {
        // 2. Perform bulk deletion in Segments
        const batch = writeBatch(firestore);
        toDelete.forEach(config => {
          batch.delete(doc(firestore, "academicGroups", config.id));
        });
        await batch.commit();
        
        // 3. Update local state
        const deleteIds = new Set(toDelete.map(c => c.id));
        setConfigurations((prev) => prev.filter(c => !deleteIds.has(c.id)));
      } catch (error) {
        console.error("Error bulk deleting academic groups:", error);
        throw error;
      }
    },
    [firestore, configurations]
  );

  const value = {
    configurations,
    getSubjectsForGroup,
    addOrUpdateConfiguration,
    createAcademicGroup,
    deleteAcademicGroupsBulk,
  };

  return (
    <AcademicStructureContext.Provider value={value}>
      {children}
    </AcademicStructureContext.Provider>
  );
}

export function useAcademicStructure() {
  const context = useContext(AcademicStructureContext);
  if (!context) {
    throw new Error('useAcademicStructure must be used within an AcademicStructureProvider');
  }
  return context;
}