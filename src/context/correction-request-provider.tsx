'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

export type CorrectionRequestStatus = 'pending' | 'resolved' | 'dismissed';

export interface CorrectionRequest {
  id: string;
  studentId: string;
  studentUid: string;
  studentName: string;
  field: string;
  description: string;
  oldValue: string;
  newValue: string;
  status: CorrectionRequestStatus;
  createdAt: any;
  updatedAt?: any;
  adminComment?: string;
}

interface CorrectionRequestContextType {
  requests: CorrectionRequest[];
  createRequest: (request: Omit<CorrectionRequest, 'id' | 'status' | 'createdAt' | 'studentUid' | 'studentName'>) => Promise<void>;
  updateRequestStatus: (requestId: string, status: CorrectionRequestStatus, adminComment?: string) => Promise<void>;
  isLoading: boolean;
}

const CorrectionRequestContext = createContext<CorrectionRequestContextType | undefined>(undefined);

export function CorrectionRequestProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, userProfile } = useUser();
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user) {
      setIsLoading(false);
      return;
    }

    const isAdmin = userProfile?.role === 'admin';
    const collectionRef = collection(firestore, "correction_requests");
    
    const q = isAdmin
      ? query(collectionRef, orderBy("createdAt", "desc"))
      : query(collectionRef, where("studentUid", "==", user.uid), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestData = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id,
      })) as CorrectionRequest[];
      setRequests(requestData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to correction_requests:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user, userProfile]);

  const createRequest = useCallback(async (data: Omit<CorrectionRequest, 'id' | 'status' | 'createdAt' | 'studentUid' | 'studentName'>) => {
    if (!firestore || !user) return;

    const newRequest = {
      ...data,
      studentUid: user.uid,
      studentName: userProfile?.displayName || user.email || "Unknown Student",
      status: 'pending' as CorrectionRequestStatus,
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(firestore, "correction_requests"), newRequest);
    } catch (error) {
      console.error("Error creating correction request:", error);
      throw error;
    }
  }, [firestore, user, userProfile]);

  const updateRequestStatus = useCallback(async (requestId: string, status: CorrectionRequestStatus, adminComment?: string) => {
    if (!firestore) return;

    try {
      const requestRef = doc(firestore, "correction_requests", requestId);
      await updateDoc(requestRef, {
        status,
        adminComment: adminComment || "",
        updatedAt: Timestamp.now(),
      });

      // If status is resolved, we might want to create a notification
      if (status === 'resolved') {
        const req = requests.find(r => r.id === requestId);
        if (req) {
          await addDoc(collection(firestore, "notifications"), {
            userId: req.studentUid,
            title: "Data Correction Complete",
            message: `Your request regarding ${req.field} has been resolved.`,
            type: "correction_update",
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error updating correction request status:", error);
      throw error;
    }
  }, [firestore, requests]);

  return (
    <CorrectionRequestContext.Provider value={{ requests, createRequest, updateRequestStatus, isLoading }}>
      {children}
    </CorrectionRequestContext.Provider>
  );
}

export function useCorrectionRequests() {
  const context = useContext(CorrectionRequestContext);
  if (context === undefined) {
    throw new Error('useCorrectionRequests must be used within a CorrectionRequestProvider');
  }
  return context;
}
