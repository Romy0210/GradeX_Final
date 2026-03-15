"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Student } from "@/lib/data";
import {
  Lightbulb,
  BookOpen,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type RecommendationsProps = {
  student: Student;
};

const RecommendationCategory = ({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string | undefined;
}) => {
  if (!text) return null;

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
  const overallSections = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Academic Recommendations",
      text: student.academicRecommendations,
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Attendance & Behavior Tips",
      text: student.behavioralRecommendations,
    },
    {
      icon: <ShieldAlert className="w-5 h-5" />,
      title: "Risk-Based Intervention Advice",
      text: student.interventionRecommendations,
    },
  ];

  const visibleSections = overallSections.filter((s) => s.text);
  const subjectRecs = student.subjectRecommendations;
  const hasSubjectRecs = subjectRecs && subjectRecs.length > 0;
  const hasOverallRecs = visibleSections.length > 0;
  const hasAnyContent = hasOverallRecs || hasSubjectRecs;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          AI-Powered Recommendations
        </CardTitle>
        <CardDescription>
          Personalized advice based on your current risk level of{" "}
          <span className="font-semibold text-foreground">
            {student.riskLevel}
          </span>{" "}
          to help you succeed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAnyContent ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              Recommendations are generated after your admin runs an analysis on your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Recommendations */}
            {hasOverallRecs && (
              <div className="space-y-6">
                <h3 className="text-base font-semibold">Overall Recommendations</h3>
                {visibleSections.map((section, index) => (
                  <React.Fragment key={section.title}>
                    <RecommendationCategory
                      icon={section.icon}
                      title={section.title}
                      text={section.text}
                    />
                    {index < visibleSections.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Subject-Specific Recommendations */}
            {hasSubjectRecs && (
              <div>
                <Separator className="my-4" />
                <h3 className="text-base font-semibold mb-4">
                  Subject-Specific Recommendations
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {subjectRecs!.map((rec, index) => (
                    <AccordionItem value={`item-${index}`} key={rec.subjectId}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <span>{rec.subjectName}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground pl-4">
                          {rec.recommendation}
                        </p>
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
