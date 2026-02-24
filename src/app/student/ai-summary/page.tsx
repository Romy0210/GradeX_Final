'use client';

import { useStudentData } from "@/context/student-data-provider";
import { useUser } from "@/firebase/auth/use-user";
import { StudyPlanPanel } from "./components/study-plan-panel";
import { AIRecommendationsPanel } from "./components/ai-recommendations-panel";
import { Loader2, AlertTriangle, Clock, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { Student } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIPredictionPanel } from "@/app/admin/student/[id]/components/ai-prediction-panel";


type AlertInfo = {
    type: 'risk' | 'assignments' | 'attendance';
    severity: 'Warning' | 'Info';
    title: string;
    message: string;
    timestamp: string;
};

const alertIcons = {
    risk: <AlertTriangle className="h-4 w-4" />,
    assignments: <Clock className="h-4 w-4" />,
    attendance: <Users className="h-4 w-4" />,
};


export default function AISummaryPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { students } = useStudentData();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);

  useEffect(() => {
      if (!isUserLoading && user) {
          const currentStudent = students.find((s) => s.email === user.email);
          setStudent(currentStudent || null);
      }
  }, [user, students, isUserLoading]);

  const adminAlerts: AlertInfo[] = [];

    if (student) {
        // Rule 1: High Academic Risk
        if (student.riskLevel === 'High') {
            adminAlerts.push({
                type: 'risk',
                severity: 'Warning',
                title: 'High Academic Risk Alert',
                message: `Your overall academic performance has placed you in a high-risk category. Please review your AI summary and study plan for targeted recommendations.`,
                timestamp: '1 hour ago'
            });
        }
        // Rule 2: High number of pending assignments
        if (student.pendingAssignments > 2) {
            adminAlerts.push({
                type: 'assignments',
                severity: 'Warning',
                title: `Admin Alert: ${student.pendingAssignments} Pending Assignments`,
                message: `Your administrator has noted that you have a high number of pending assignments. Please prioritize completing these to improve your academic standing.`,
                timestamp: '2 hours ago'
            });
        }
        // Rule 3: Low attendance
        if (student.attendancePercentage < 80) {
            adminAlerts.push({
                type: 'attendance',
                severity: 'Warning',
                title: 'Low Attendance Alert',
                message: `Your overall attendance is currently ${student.attendancePercentage}%. Consistent attendance is crucial for success.`,
                timestamp: '4 hours ago'
            });
        }
    }

  // Loading state
  if (student === undefined || isUserLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Not found state
  if (student === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Student Data Not Found</h1>
        <p className="text-muted-foreground">
          We couldn't find any performance data associated with your account ({user?.email}).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {adminAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'Warning' ? 'destructive' : 'default'}>
                {alertIcons[alert.type]}
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>
                    {alert.message}
                    <span className="block text-xs text-muted-foreground mt-2">{alert.timestamp}</span>
                </AlertDescription>
            </Alert>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI-Powered Summary
          </h1>
          <p className="text-muted-foreground">
            Personalized predictions and recommendations based on your performance.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2 auto-rows-min">
          <div className="flex flex-col gap-4 md:gap-8">
            <AIPredictionPanel predictionData={student} isLoading={false} />
            <AIRecommendationsPanel recommendationsData={student} isLoading={isUserLoading} />
          </div>
          <StudyPlanPanel student={student} />
      </div>
    </>
  );
}