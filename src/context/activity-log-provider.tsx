'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type ActivityEventType =
  | "BULK_UPLOAD"
  | "AI_ANALYSIS"
  | "STUDENT_ADD"
  | "STUDENT_UPDATE"
  | "STUDENT_DELETE"
  | "EXPORT"
  | "SETTINGS_UPDATE";

export type Activity = {
  id: string;
  eventType: ActivityEventType;
  description: string;
  performedBy: string;
  createdAt: string; // ISO string
};

const LOG_LIMIT = 50;

interface ActivityLogContextType {
  activities: Activity[];
  logActivity: (eventType: ActivityEventType, description: string) => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const { user } = useUser();

  // Real-time listener for activity logs, ordered by createdAt descending, limited to 50
  useEffect(() => {
    if (!firestore) return;

    const q = query(
      collection(firestore, "activityLogs"),
      orderBy("createdAt", "desc"),
      limit(LOG_LIMIT)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logData: Activity[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          // Convert Firestore Timestamp to ISO string for consistency
          let createdAtStr = new Date().toISOString();
          if (data.createdAt instanceof Timestamp) {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtStr = data.createdAt;
          }
          return {
            id: docSnap.id,
            eventType: data.eventType,
            description: data.description,
            performedBy: data.performedBy,
            createdAt: createdAtStr,
          } as Activity;
        });
        setActivities(logData);
      },
      (error) => {
        console.error("Error listening to activity logs:", error);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  const logActivity = useCallback(async (eventType: ActivityEventType, description: string) => {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, "activityLogs"), {
        eventType,
        description,
        performedBy: user?.email ?? 'System',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging activity to Firestore:", error);
    }
  }, [firestore, user]);

  const value = { activities, logActivity };

  return (
    <ActivityLogContext.Provider value={value}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
}
