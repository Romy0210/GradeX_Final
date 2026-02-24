'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useUser } from "@/firebase/auth/use-user";

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

const STORAGE_KEY = "gradex-activity-log";
const LOG_LIMIT = 50; // Keep the log from growing indefinitely

interface ActivityLogContextType {
  activities: Activity[];
  logActivity: (eventType: ActivityEventType, description: string) => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    if (isClient) {
      try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
          setActivities(JSON.parse(item));
        }
      } catch (error) {
        console.error("Error reading activity log from localStorage.", error);
      }
    }
  }, [isClient]);

  // Persist to localStorage on change
  useEffect(() => {
    if (isClient) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
      } catch (error) {
        console.error("Error writing activity log to localStorage", error);
      }
    }
  }, [activities, isClient]);

  const logActivity = useCallback((eventType: ActivityEventType, description: string) => {
    const newActivity: Activity = {
        id: crypto.randomUUID(),
        eventType,
        description,
        performedBy: user?.email ?? 'System',
        createdAt: new Date().toISOString(),
    };

    setActivities(prevActivities => {
        const updatedLog = [newActivity, ...prevActivities];
        // Enforce a limit on the number of log entries
        if (updatedLog.length > LOG_LIMIT) {
            return updatedLog.slice(0, LOG_LIMIT);
        }
        return updatedLog;
    });
  }, [user]);

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
