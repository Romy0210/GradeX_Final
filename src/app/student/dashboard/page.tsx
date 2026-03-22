"use client";

import { useStudentData } from "@/context/student-data-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PerformanceSnapshot } from "./components/performance-snapshot";
import { AttendanceBehavior } from "./components/attendance-behavior";
import { useUser } from "@/firebase/auth/use-user";
import { Loader2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { Student } from "@/lib/data";
import { SubjectPerformanceBreakdown } from "./components/subject-performance-breakdown";
import { ReportErrorDialog } from "./components/report-error-dialog";
import { Badge } from "@/components/ui/badge";
import { useCorrectionRequests } from "@/context/correction-request-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StudentDashboard() {
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

  // Resolve profilePhoto
  let finalProfilePhotoUrl: string | undefined = undefined;
  if (student.profilePhoto) {
    if (student.profilePhoto.startsWith('http')) {
      finalProfilePhotoUrl = student.profilePhoto;
    } else {
      const placeholder = PlaceHolderImages.find(p => p.id === student.profilePhoto);
      if (placeholder) {
        finalProfilePhotoUrl = placeholder.imageUrl;
      }
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {student.name.split(" ")[0]}!
            </h1>
            {pendingRequests.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/5">
                        <Clock className="w-3 h-3 mr-1" />
                        {pendingRequests.length} Pending Correction{pendingRequests.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You have {pendingRequests.length} academic correction request(s) awaiting review.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-muted-foreground">
            Here's a summary of your academic performance.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ReportErrorDialog student={student} />
          <Avatar className="h-14 w-14">
            <AvatarImage src={finalProfilePhotoUrl} alt={student.name} />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2">
        <PerformanceSnapshot student={student} />
        <AttendanceBehavior student={student} />
        <SubjectPerformanceBreakdown student={student} />
      </div>
    </>
  );
}
