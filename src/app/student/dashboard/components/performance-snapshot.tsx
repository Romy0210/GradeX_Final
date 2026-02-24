import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Student } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

type PerformanceSnapshotProps = {
  student: Student;
};

const Gauge = ({ value, max, label }: { value: number, max: number, label: string }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-lg font-bold">{value} <span className="text-sm font-normal text-muted-foreground">/ {max}</span></span>
        </div>
        <Progress value={(value / max) * 100} />
    </div>
);


export function PerformanceSnapshot({ student }: PerformanceSnapshotProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Snapshot</CardTitle>
        <CardDescription>
          Your key academic performance metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Gauge value={student.gpa} max={10} label="GPA" />
        
        <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                 <span className="text-sm text-muted-foreground">Subject Marks</span>
                 <div className="p-2 bg-primary/10 rounded-lg">
                    <span className="text-lg font-bold text-primary">{student.overallAverageMarkPercentage.toFixed(1)}%</span>
                    <span className="text-sm text-primary/80"> Overall Avg.</span>
                </div>
            </div>
            {student.subjects.map((subject, index) => {
                 const average = (subject.internalMark1 + subject.internalMark2) / 2;
                 return (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{subject.subjectName}</span>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="font-bold">{subject.internalMark1}</p>
                                <p className="text-xs text-muted-foreground">Mark 1</p>
                            </div>
                             <div className="text-center">
                                <p className="font-bold">{subject.internalMark2}</p>
                                <p className="text-xs text-muted-foreground">Mark 2</p>
                            </div>
                            <Badge variant="secondary">Avg: {average.toFixed(1)}</Badge>
                        </div>
                    </div>
                 )
            })}
        </div>
      </CardContent>
    </Card>
  );
}
