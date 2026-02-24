
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Student } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

type StudentPerformanceSnapshotProps = {
  student: Student;
};

const DataRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between items-center text-sm py-1">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-medium text-right">{value}</p>
  </div>
);

const TOTAL_SESSIONS = 60; // Standardize total sessions

export function StudentPerformanceSnapshot({
  student,
}: StudentPerformanceSnapshotProps) {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Snapshot</CardTitle>
        <CardDescription>Saved academic and personal data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-2">Personal Information</h3>
          <div className="space-y-1">
            <DataRow label="Full Name" value={student.name} />
            <DataRow label="Email" value={student.email} />
            <DataRow label="Age" value={student.age} />
            <DataRow label="Gender" value={student.gender} />
            <DataRow label="Phone Number" value={student.phone} />
            <DataRow label="Education" value={student.educationalBackground} />
          </div>
        </div>
        <Separator />
         <div>
          <h3 className="font-semibold text-sm mb-2">Academic Context</h3>
          <div className="space-y-1">
            <DataRow label="Batch" value={student.batch} />
            <DataRow label="Class / Department" value={student.class} />
            <DataRow label="Semester" value={student.semester} />
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-sm mb-2">Overall Performance Metrics</h3>
          <div className="space-y-1">
            <DataRow label="GPA (out of 10)" value={(student.gpa || 0).toFixed(1)} />
            <DataRow
              label="Overall Average Mark"
              value={`${(student.overallAverageMarkPercentage || 0).toFixed(1)}%`}
            />
             <DataRow
              label="Overall Avg. Attendance"
              value={`${(student.attendancePercentage || 0).toFixed(1)}%`}
            />
            <DataRow
              label="Total Completed Assignments"
              value={student.assignmentCompletion || 0}
            />
             <DataRow
              label="Total Pending Assignments"
              value={student.pendingAssignments || 0}
            />
             <DataRow
              label="Overall Completion Rate"
              value={`${(student.assignmentCompletionPercentage || 0).toFixed(1)}%`}
            />
          </div>
        </div>
         <Separator />
          <div>
          <h3 className="font-semibold text-sm mb-2">Subject-wise Performance</h3>
          <div className="space-y-3">
            {student.subjects?.map((subject, index) => {
              const internalMark1 = subject.internalMark1 || 0;
              const internalMark2 = subject.internalMark2 || 0;
              const completedAssignments = subject.completedAssignments || 0;
              const totalAssignments = subject.totalAssignments || 0;
              const subjectAttendancePercentage = subject.subjectAttendancePercentage || 0;

              const average = (internalMark1 + internalMark2) / 2;
              const completionRate = totalAssignments > 0 
                ? (completedAssignments / totalAssignments) * 100 
                : 100;
              const pendingAssignments = totalAssignments - completedAssignments;

              const presentSessions = Math.round(TOTAL_SESSIONS * (subjectAttendancePercentage / 100));
              const absentSessions = TOTAL_SESSIONS - presentSessions;

              return (
                 <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{subject.subjectName}</p>
                        <Badge variant="secondary">Avg. Mark: {average.toFixed(1)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-muted-foreground">Internal Mark 1:</p>
                        <p className="font-semibold text-right">{internalMark1}</p>
                        <p className="text-muted-foreground">Internal Mark 2:</p>
                        <p className="font-semibold text-right">{internalMark2}</p>
                    </div>
                    <Separator className="my-2"/>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-muted-foreground">Completed Assignments:</p>
                        <p className="font-semibold text-right">{completedAssignments} / {totalAssignments}</p>
                        <p className="text-muted-foreground">Pending Assignments:</p>
                        <p className="font-semibold text-right">{pendingAssignments < 0 ? 0 : pendingAssignments}</p>
                        <p className="text-muted-foreground">Completion Rate:</p>
                        <p className="font-semibold text-right">{completionRate.toFixed(0)}%</p>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-muted-foreground">Attendance:</p>
                        <p className="font-semibold text-right">{subjectAttendancePercentage.toFixed(0)}%</p>
                        <p className="text-muted-foreground">Sessions Present:</p>
                        <p className="font-semibold text-right">{presentSessions} / {TOTAL_SESSIONS}</p>
                        <p className="text-muted-foreground">Sessions Absent:</p>
                        <p className="font-semibold text-right">{absentSessions}</p>
                    </div>
                 </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
