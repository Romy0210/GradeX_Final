
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
import { AlertCircle, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SubjectPerformanceBreakdownProps = {
  student: Student;
};

const getRiskBadgeVariant = (
  riskLevel?: "Low" | "Medium" | "High"
): "default" | "secondary" | "destructive" => {
  switch (riskLevel) {
    case "Low":
      return "default";
    case "Medium":
      return "secondary";
    case "High":
      return "destructive";
    default:
      return "secondary";
  }
};

const getAttendanceColor = (percentage: number) => {
    if (percentage < 75) return 'text-destructive';
    if (percentage < 85) return 'text-yellow-500';
    return 'text-green-500';
};

const getPendingAssignmentsColor = (count: number) => {
    if (count >= 3) return 'text-destructive';
    if (count >= 1) return 'text-yellow-500';
    return 'text-green-500';
};

const generateRiskReason = (subject: any, analysis: any): string => {
    if (analysis?.riskLevel !== 'High') return '';

    const reasons = [];
    const avgMark = ((subject.internalMark1 || 0) + (subject.internalMark2 || 0)) / 2;
    const pendingAssignments = (subject.totalAssignments || 0) - (subject.completedAssignments || 0);

    if (avgMark < 22) { // Assuming passing is 22/40 (55%)
        reasons.push('low internal marks');
    }
    if (pendingAssignments >= 3) {
        reasons.push('multiple pending assignments');
    }
    if (subject.subjectAttendancePercentage < 75) {
        reasons.push('low attendance');
    }
    
    if (reasons.length === 0) {
        // Fallback reason if none of the specific rules match but risk is still high
        return 'This subject is flagged as high-risk based on the overall prediction model.';
    }

    return `This subject is marked high-risk due to ${reasons.join(' and ')}.`;
};


export function SubjectPerformanceBreakdown({ student }: SubjectPerformanceBreakdownProps) {
    if (!student.subjects || student.subjects.length === 0) {
        return null;
    }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Subject Performance Intelligence</CardTitle>
        <CardDescription>A detailed breakdown of your performance in each enrolled subject.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {student.subjects.map((subject) => {
            const analysis = student.subjectAnalyses?.find(sa => sa.subjectId === subject.subjectId);
            const averageMark = ((subject.internalMark1 || 0) + (subject.internalMark2 || 0)) / 2;
            const completionRate = subject.totalAssignments > 0 ? ((subject.completedAssignments || 0) / subject.totalAssignments) * 100 : 100;
            const pendingAssignments = (subject.totalAssignments || 0) - (subject.completedAssignments || 0);
            const riskReason = generateRiskReason(subject, analysis);

            return (
                <div key={subject.subjectId} className="p-4 border rounded-lg space-y-3 bg-card">
                     <div className="flex justify-between items-start">
                        <h3 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> {subject.subjectName}</h3>
                        <Badge variant={getRiskBadgeVariant(analysis?.riskLevel)}>
                            {analysis?.riskLevel || 'N/A'} Risk
                        </Badge>
                     </div>

                     <Separator />
                     
                     <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <p className="text-muted-foreground">Average Marks</p>
                        <p className="font-semibold text-right">{averageMark.toFixed(1)} / 40</p>
                        
                        <p className="text-muted-foreground">Attendance</p>
                        <p className={`font-semibold text-right ${getAttendanceColor(subject.subjectAttendancePercentage || 0)}`}>
                            {(subject.subjectAttendancePercentage || 0).toFixed(0)}%
                        </p>

                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-semibold text-right">{subject.completedAssignments || 0} / {subject.totalAssignments || 0}</p>
                        
                        <p className="text-muted-foreground">Pending</p>
                        <p className={`font-semibold text-right ${getPendingAssignmentsColor(pendingAssignments)}`}>
                            {pendingAssignments < 0 ? 0 : pendingAssignments}
                        </p>

                         <p className="text-muted-foreground">Completion Rate</p>
                        <p className="font-semibold text-right">{completionRate.toFixed(0)}%</p>
                     </div>
                     
                     {riskReason && (
                        <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="mt-2 text-xs text-destructive flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                                    <AlertCircle className="h-4 w-4 shrink-0"/>
                                    <span className="truncate">High-Risk Factors Identified</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{riskReason}</p>
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                     )}
                </div>
            )
        })}
      </CardContent>
    </Card>
  );
}
