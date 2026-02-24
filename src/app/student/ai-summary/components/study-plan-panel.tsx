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
import type { Student } from "@/lib/data";
import { type GenerateStudyPlanOutput } from "@/ai/flows/generate-study-plan";
import { ScrollText, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// New component to render the parsed study plan
const RenderStudyPlan = ({ plan }: { plan: string }) => {
  const sections = plan.split(/(?=^#\s|##\s|###\s)/m).map(p => p.trim()).filter(Boolean);
  
  const weeklyScheduleIndex = sections.findIndex(sec => sec.startsWith('###'));

  const introSections = weeklyScheduleIndex > -1 ? sections.slice(0, weeklyScheduleIndex) : sections;
  const weeklyScheduleSections = weeklyScheduleIndex > -1 ? sections.slice(weeklyScheduleIndex) : [];

  const renderMarkdownSection = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-3 mb-1">{line.substring(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-md font-medium mt-2">{line.substring(4)}</h3>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-1">{line.substring(2, line.length-2)}</p>
      if (line.startsWith('* ') || line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-muted-foreground">{line.substring(2)}</li>;
      if (line.trim() === '') return null;
      return <p key={i} className="text-muted-foreground my-1">{line}</p>;
    });
  }

  return (
      <div className="space-y-4">
        {introSections.map((section, index) => (
           <div key={`intro-${index}`}>
              {renderMarkdownSection(section)}
           </div>
        ))}
        
        {weeklyScheduleSections.length > 0 && (
          <>
          <Separator className="my-6" />
          <h2 className="text-xl font-bold mb-4">Your 7-Day Schedule</h2>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {weeklyScheduleSections.map((day, index) => {
                  const lines = day.split('\n');
                  const title = lines[0].replace('###', '').trim();
                  const tasks = lines.slice(1);
                  
                  return (
                      <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger className="text-md font-semibold text-left">
                              {title}
                              <Badge variant="outline" className="ml-auto mr-4 font-normal">Suggested</Badge>
                          </AccordionTrigger>
                          <AccordionContent>
                             <ul className="pl-2 space-y-2">
                              {tasks.map((task, i) => task.trim().startsWith('- ') ? <li key={i} className="ml-4 list-disc text-muted-foreground">{task.substring(2)}</li> : null)}
                             </ul>
                          </AccordionContent>
                      </AccordionItem>
                  );
              })}
          </Accordion>
          </>
        )}
      </div>
  );
};


type StudyPlanPanelProps = {
  student: Student;
};

export function StudyPlanPanel({ student }: StudyPlanPanelProps) {
  const [studyPlan, setStudyPlan] = useState<GenerateStudyPlanOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-primary" />
          Personalized Study Plan
        </CardTitle>
        <CardDescription>
          A custom 1-week plan to help you achieve your academic goals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!studyPlan && !isLoading ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground mb-4">
              Get a step-by-step weekly plan to boost your performance.
            </p>
            <Button onClick={handleGenerateStudyPlan}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My Study Plan
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <br />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[600px] w-full pr-4">
            {studyPlan?.studyPlan && <RenderStudyPlan plan={studyPlan.studyPlan} />}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
