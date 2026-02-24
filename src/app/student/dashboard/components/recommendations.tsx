"use client";

import React, { useState } from "react";
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
import {
  type PersonalizedRecommendationsOutput,
} from "@/ai/flows/generate-personalized-recommendations";
import {
  Lightbulb,
  Sparkles,
  BookOpen,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type RecommendationsProps = {
  student: Student;
};

const RecommendationCategory = ({
  icon,
  title,
  text,
  isLoading,
}: {
  icon: React.ReactNode;
  title: string;
  text: string | undefined;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex gap-4">
        <Skeleton className="h-6 w-6 mt-1 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div className="flex gap-4">
      <div className="text-primary mt-1">{icon}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-card-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
};


export function Recommendations({ student }: RecommendationsProps) {
  const [recommendations, setRecommendations] =
    useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateRecommendations = async () => {
    setIsLoading(true);
    toast({
      title: "Generating Recommendations...",
      description: "Creating personalized advice just for you.",
    });
    try {
      const response = await fetch('/api/generate-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riskLevel: student.riskLevel,
          outcome: student.outcome,
          gradeCategory: student.gradeCategory,
          academicPerformance: `GPA: ${student.gpa}, Avg Mark: ${student.averageMarkPercentage}%`,
          attendancePercentage: student.attendancePercentage,
          assignmentCompletionPercentage: student.assignmentCompletionPercentage,
          pendingAssignments: student.pendingAssignments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'API Error', details: response.statusText }));
        throw new Error(errorData.details || errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
       setRecommendations(result);
       toast({
        title: "Recommendations Generated",
        description: "Your AI-powered advice is ready.",
      });
    } catch (error: any) {
      console.error("Failed to fetch recommendations:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recommendationSections = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Academic Recommendations",
      text: recommendations?.academicRecommendations,
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Attendance & Behavior Tips",
      text: recommendations?.behavioralRecommendations,
    },
    {
      icon: <ShieldAlert className="w-5 h-5" />,
      title: "Risk-Based Intervention Advice",
      text: recommendations?.interventionRecommendations,
    },
  ];

  const visibleSections = isLoading ? recommendationSections : recommendationSections.filter(s => s.text);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Lightbulb className="w-6 h-6 text-primary" />
          AI-Powered Recommendations
        </CardTitle>
        <CardDescription>
          Personalized advice based on your current risk level of <span className="font-semibold text-foreground">{student.riskLevel}</span> to help you succeed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!recommendations && !isLoading ? (
           <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-4">Get personalized tips based on your performance.</p>
                <Button onClick={handleGenerateRecommendations}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate My Recommendations
                </Button>
            </div>
        ) : (
           <div className="space-y-6">
             {visibleSections.map((section, index) => (
                <React.Fragment key={section.title}>
                  <RecommendationCategory
                    icon={section.icon}
                    title={section.title}
                    text={section.text}
                    isLoading={isLoading}
                  />
                  {index < visibleSections.length - 1 && <Separator />}
                </React.Fragment>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
