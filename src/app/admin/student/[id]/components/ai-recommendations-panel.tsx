"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Student } from "@/lib/data";
import { type PersonalizedRecommendationsOutput } from "@/ai/flows/generate-personalized-recommendations";
import {
  BookOpen,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

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
        <Skeleton className="h-6 w-6 mt-1 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
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

type RecommendationsData = Partial<Student> &
  Partial<PersonalizedRecommendationsOutput>;

const cleanRecommendation = (text: string | undefined) => {
  if (!text) return text;
  return text
    .replace(/\d+\.\s+\*\*The 'Why':\*\*/g, '')
    .replace(/\d+\.\s+\*\*What to do now:\*\*/g, '')
    .replace(/\*\*The 'Why':\*\*/g, '')
    .replace(/\*\*What to do now:\*\*/g, '')
    .replace(/\d+\.\s+\*\*/g, '') // Matches "1. **"
    .replace(/\*\*/g, '')
    .trim();
};

export function AIRecommendationsPanel({
  recommendationsData,
  isLoading,
}: {
  recommendationsData: RecommendationsData;
  isLoading: boolean;
}) {
  const overallRecommendations = {
    academic: cleanRecommendation(recommendationsData.academicRecommendations),
    behavioral: cleanRecommendation(recommendationsData.behavioralRecommendations),
    intervention: cleanRecommendation(recommendationsData.interventionRecommendations),
  };
  
  const subjectRecommendations = recommendationsData.subjectRecommendations;

  const hasOverallRecommendations =
    overallRecommendations.academic ||
    overallRecommendations.behavioral ||
    overallRecommendations.intervention;
    
  const hasSubjectRecommendations = subjectRecommendations && subjectRecommendations.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          AI-Powered Recommendations
        </CardTitle>
        <CardDescription>
          Personalized advice based on overall and subject-specific analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <RecommendationCategory
              icon={<BookOpen className="w-5 h-5" />}
              title="Academic"
              text={undefined}
              isLoading={true}
            />
            <RecommendationCategory
              icon={<TrendingUp className="w-5 h-5" />}
              title="Behavioral"
              text={undefined}
              isLoading={true}
            />
            <Separator />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !hasOverallRecommendations ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              Recommendations are generated after a student's data is updated.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Overall Recommendations</h3>
              <div className="space-y-6">
                <RecommendationCategory
                  icon={<BookOpen className="w-5 h-5" />}
                  title="Academic"
                  text={overallRecommendations.academic}
                  isLoading={false}
                />
                <RecommendationCategory
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Behavioral"
                  text={overallRecommendations.behavioral}
                  isLoading={false}
                />
                <RecommendationCategory
                  icon={<ShieldAlert className="w-5 h-5" />}
                  title="Intervention"
                  text={overallRecommendations.intervention}
                  isLoading={false}
                />
              </div>
            </div>
            
            {hasSubjectRecommendations && (
                <div>
                  <Separator className="my-6" />
                  <h3 className="text-lg font-semibold mb-4">Subject-Specific Recommendations</h3>
                  <Accordion type="single" collapsible className="w-full">
                     {subjectRecommendations.map((rec, index) => (
                        <AccordionItem value={`item-${index}`} key={rec.subjectId}>
                           <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                <span>{rec.subjectName}</span>
                              </div>
                           </AccordionTrigger>
                           <AccordionContent>
                              <p className="text-sm text-muted-foreground pl-4">{rec.recommendation}</p>
                           </AccordionContent>
                        </AccordionItem>
                     ))}
                  </Accordion>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
