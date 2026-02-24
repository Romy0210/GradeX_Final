import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Student } from "@/lib/data";

type AttendanceBehaviorProps = {
  student: Student;
};

export function AttendanceBehavior({ student }: AttendanceBehaviorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance & Behavior</CardTitle>
        <CardDescription>
          Your attendance and assignment completion status.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-muted-foreground">Attendance</span>
            <span className="text-lg font-bold">
              {student.attendancePercentage}%
            </span>
          </div>
          <Progress value={student.attendancePercentage} />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-muted-foreground">
              Assignment Completion
            </span>
            <span className="text-lg font-bold">
              {student.assignmentCompletionPercentage}%
            </span>
          </div>
          <Progress value={student.assignmentCompletionPercentage} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <span className="text-sm text-muted-foreground">
            Pending Assignments
          </span>
          <span className="text-2xl font-bold text-destructive">
            {student.pendingAssignments}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
