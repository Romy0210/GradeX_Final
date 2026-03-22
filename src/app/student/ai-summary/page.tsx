'use client';

import { useStudentData } from "@/context/student-data-provider";
import { useUser } from "@/firebase/auth/use-user";
import { StudyPlanPanel } from "./components/study-plan-panel";
import { Recommendations } from "../dashboard/components/recommendations";
import { Loader2, AlertTriangle, Clock, Users, CheckCircle, XCircle, Bell, Info } from "lucide-react";
import { useCorrectionRequests } from "@/context/correction-request-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  const { requests } = useCorrectionRequests();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);

  useEffect(() => {
    if (!isUserLoading && user) {
      if (students.length === 0) {
        setStudent(null);
      } else {
        const currentStudent = students.find((s) => s.authUid === user.uid || s.id === user.uid);
        setStudent(currentStudent || null);
      }
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
        timestamp: 'Just now'
      });
    }
    // Rule 2: High number of pending assignments
    if (student.pendingAssignments > 2) {
      adminAlerts.push({
        type: 'assignments',
        severity: 'Warning',
        title: `Admin Alert: ${student.pendingAssignments} Pending Assignments`,
        message: `Your administrator has noted that you have a high number of pending assignments. Please prioritize completing these to improve your academic standing.`,
        timestamp: 'Just now'
      });
    }
    // Rule 3: Low attendance
    if (student.attendancePercentage < 80) {
      adminAlerts.push({
        type: 'attendance',
        severity: 'Warning',
        title: 'Low Attendance Alert',
        message: `Your overall attendance is currently ${student.attendancePercentage}%. Consistent attendance is crucial for success.`,
        timestamp: 'Just now'
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

  const studentResolvedRequests = requests.filter(r => r.status !== 'pending' && r.studentUid === user?.uid);
  const hasUpdates = adminAlerts.length > 0 || studentResolvedRequests.length > 0;

  return (
    <>
      {hasUpdates && (
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Bell className="h-4 w-4" />
              Academic Notifications & Updates
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tight">
              {adminAlerts.length + studentResolvedRequests.length} New
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[250px]">
              <div className="divide-y divide-border/40">
                {adminAlerts.map((alert, index) => (
                  <div key={`alert-${index}`} className={`flex gap-3 p-4 hover:bg-muted/30 transition-colors ${alert.severity === 'Warning' ? 'bg-destructive/5' : ''}`}>
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${alert.severity === 'Warning' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {alertIcons[alert.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-bold ${alert.severity === 'Warning' ? 'text-destructive' : 'text-foreground'}`}>{alert.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">"{alert.message}"</p>
                    </div>
                  </div>
                ))}
                
                {studentResolvedRequests.map((req) => (
                  <div key={req.id} className="flex gap-3 p-4 hover:bg-muted/30 transition-colors bg-green-500/5">
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${req.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {req.status === 'resolved' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-foreground">Correction {req.status === 'resolved' ? 'Resolved' : 'Dismissed'}: {req.field}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{req.updatedAt ? new Date(req.updatedAt.toDate()).toLocaleDateString() : 'Recently'}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">Admin Feedback: "{req.adminComment || "No comment provided."}"</p>
                        {req.status === 'resolved' && (
                          <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold uppercase tracking-wider mt-1">
                            <Info className="h-3 w-3" />
                            System Updated
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
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
          <Recommendations student={student} />
        </div>
        <StudyPlanPanel student={student} />
      </div>
    </>
  );
}