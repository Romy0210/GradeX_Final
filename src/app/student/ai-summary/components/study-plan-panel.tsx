"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useStudentData } from "@/context/student-data-provider";
import type { Student } from "@/lib/data";
import { type GenerateStudyPlanOutput } from "@/ai/flows/generate-study-plan";
import { ScrollText, Sparkles, RefreshCw, Calendar, CheckCircle2, Clock, BookOpen, GraduationCap, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Enhanced component to render the parsed study plan with better visuals
const RenderStudyPlan = ({ plan }: { plan: string }) => {
  const sections = plan.split(/(?=^#\s|##\s|###\s)/m).map(p => p.trim()).filter(Boolean);

  const weeklyScheduleIndex = sections.findIndex(sec => sec.startsWith('###'));

  const introSections = weeklyScheduleIndex > -1 ? sections.slice(0, weeklyScheduleIndex) : sections;
  const weeklyScheduleSections = weeklyScheduleIndex > -1 ? sections.slice(weeklyScheduleIndex) : [];

  const renderMarkdownSection = (text: string) => {
    return text.split('\n').map((line, i) => {
      const cleanLine = line.replace(/^#$/, '').trim();
      if (!cleanLine) return null;

      if (cleanLine.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-6 mb-3 text-primary flex items-center gap-2"><Target className="h-5 w-5" /> {cleanLine.substring(2)}</h1>;
      if (cleanLine.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 flex items-center gap-2 text-foreground/90"><BookOpen className="h-4 w-4" /> {cleanLine.substring(3)}</h2>;
      if (cleanLine.startsWith('### ')) return <h3 key={i} className="text-md font-medium mt-3 mb-1 text-foreground/80">{cleanLine.substring(4)}</h3>;
      if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) return (
        <li key={i} className="ml-4 list-none flex items-start gap-2 text-muted-foreground my-1.5 p-2 rounded-md bg-muted/30">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>{cleanLine.substring(2).replace(/\*\*(.*?)\*\*/g, '$1')}</span>
        </li>
      );
      
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      
      return (
        <p key={i} className="text-muted-foreground my-2 leading-relaxed">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-foreground font-semibold">{part.substring(2, part.length - 2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  }

  return (
    <div className="space-y-6 pb-40">
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-8">
        {introSections.map((section, index) => (
          <div key={`intro-${index}`}>
            {renderMarkdownSection(section)}
          </div>
        ))}
      </div>

      {weeklyScheduleSections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-extrabold tracking-tight">Your 7-Day Success Roadmap</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {weeklyScheduleSections.map((day, index) => {
              const lines = day.split('\n');
              const title = lines[0].replace('###', '').trim();
              const tasks = lines.slice(1).filter(t => t.trim().length > 0);

              return (
                <Card key={index} className="border-border/40 hover:border-primary/30 transition-all hover:shadow-md bg-card/50">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/10 bg-muted/20">
                    <CardTitle className="text-md font-bold text-primary flex items-center gap-2">
                       <Clock className="h-4 w-4" />
                       {title}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">Day {index + 1}</Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-3">
                      {tasks.map((task, i) => {
                         const cleanTask = task.trim().startsWith('- ') ? task.substring(2) : task;
                         return (
                           <li key={i} className="flex items-start gap-3 group">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                             <span className="text-sm text-foreground/80 leading-snug">{cleanTask}</span>
                           </li>
                         );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20">
        <div className="flex items-center gap-2 mb-2 text-primary">
          <GraduationCap className="h-6 w-6" />
          <h3 className="text-lg font-bold">GPA Recovery Projection</h3>
        </div>
        <p className="text-sm text-muted-foreground italic">
          Consistent adherence to this plan is projected to significantly improve your academic standing. Stay focused and disciplined!
        </p>
      </div>
    </div>
  );
};


type StudyPlanPanelProps = {
  student: Student;
};

export function StudyPlanPanel({ student }: StudyPlanPanelProps) {
  const [studyPlan, setStudyPlan] = useState<GenerateStudyPlanOutput | null>(
    student.studyPlan ? { studyPlan: student.studyPlan } : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { updateStudent } = useStudentData();

  const handleGenerateStudyPlan = async () => {
    setIsLoading(true);
    toast({
      title: "Generating Study Plan...",
      description: "Crafting a personalized study schedule for you.",
    });
    try {
      const subjectDataForPlan = (student.subjects || []).map(subject => {
        const analysis = student.subjectAnalyses?.find(sa => sa.subjectId === subject.subjectId);
        const averageMarkPercentage = ((subject.internalMark1 || 0) + (subject.internalMark2 || 0)) / 80 * 100;
        const pendingAssignments = (subject.totalAssignments || 0) - (subject.completedAssignments || 0);

        return {
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          riskLevel: analysis?.riskLevel || 'Medium',
          outcome: analysis?.outcome || 'Pass',
          gradeCategory: analysis?.gradeCategory || 'C',
          averageMarkPercentage: averageMarkPercentage,
          subjectAttendancePercentage: subject.subjectAttendancePercentage || 100,
          pendingAssignments: pendingAssignments < 0 ? 0 : pendingAssignments,
        };
      });

      const response = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: student.name,
          gpa: student.gpa,
          pendingAssignments: student.pendingAssignments,
          gradeCategory: student.gradeCategory,
          overallAverageMarkPercentage: student.overallAverageMarkPercentage,
          attendancePercentage: student.attendancePercentage,
          riskLevel: student.riskLevel,
          subjects: subjectDataForPlan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'API Error', details: response.statusText }));
        throw new Error(errorData.details || errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      setStudyPlan(result);

      await updateStudent({
        ...student,
        studyPlan: result.studyPlan,
      });

      toast({
        title: "Study Plan Generated",
        description: "Your new study plan is ready.",
      });
    } catch (error: any) {
      console.error("Failed to fetch study plan:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pr-6 border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            Personalized Study Plan
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            A custom 1-week plan to achieve your academic goals
          </CardDescription>
        </div>
        {studyPlan && !isLoading && (
          <Button variant="outline" size="sm" onClick={handleGenerateStudyPlan} className="h-8 rounded-full border-primary/20 hover:bg-primary/10 transition-colors">
            <RefreshCw className="mr-2 h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {!studyPlan && !isLoading ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-primary/[0.02] border-primary/20">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-bold mb-2">Build Your Success Pathway</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
              Our AI will analyze your performance and craft a custom weekly schedule to improve your GPA.
            </p>
            <Button onClick={handleGenerateStudyPlan} className="rounded-full px-8 shadow-md hover:shadow-lg transition-all">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My Plan
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4 pt-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[650px] w-full pr-4">
            {studyPlan?.studyPlan && <RenderStudyPlan plan={studyPlan.studyPlan} />}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
