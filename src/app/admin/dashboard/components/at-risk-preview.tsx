"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, User, ChevronDown, ChevronUp } from "lucide-react";
import type { Student } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AtRiskPreviewProps = {
  data: Student[];
};

export default function AtRiskPreview({ data }: AtRiskPreviewProps) {
  const highRiskStudents = data.filter((s) => s.riskLevel === "High" || (s.subjectAnalyses?.some(sub => sub.riskLevel === "High") ?? false)).slice(0, 5);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set()
  );

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>High-Risk Students Spotlight</CardTitle>
        <CardDescription>
          A preview of students needing immediate attention.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {highRiskStudents.length > 0 ? (
          highRiskStudents.map((student) => {
            let profileImageUrl = undefined;
            if (student.profilePhoto) {
              const photo = placeholderImages.find(p => p.id === student.profilePhoto);
              if (photo?.imageUrl) profileImageUrl = photo.imageUrl;
            }
            if (!profileImageUrl) {
               profileImageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=0284c7&textColor=ffffff`;
            }

            const highRiskSubjects =
              student.subjectAnalyses?.filter((s) => s.riskLevel === "High") ??
              [];
            const riskSubjectCount = highRiskSubjects.length;
            const isExpanded = expandedStudents.has(student.id);

            return (
              <div
                key={student.id}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={profileImageUrl}
                        alt={student.name}
                      />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{student.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>GPA: {student.gpa.toFixed(1)}</span>
                        <span>
                          Att: {student.attendancePercentage.toFixed(0)}%
                        </span>
                        <button
                          onClick={() =>
                            riskSubjectCount > 0 &&
                            toggleStudentExpansion(student.id)
                          }
                          disabled={riskSubjectCount === 0}
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            riskSubjectCount > 0
                              ? "cursor-pointer border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30"
                              : "cursor-default border-transparent bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          )}
                        >
                          Risk Subjects: {riskSubjectCount}
                          {riskSubjectCount > 0 &&
                            (isExpanded ? (
                              <ChevronUp className="h-3 w-3 ml-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 ml-1" />
                            ))}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/student/${student.id}`}>
                        <User className="h-4 w-4" />
                        <span className="sr-only">View Profile</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                {isExpanded && highRiskSubjects.length > 0 && (
                  <div className="pl-12 pt-2">
                    <h4 className="text-xs font-semibold mb-1 text-card-foreground">
                      High Risk Subjects:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                      {highRiskSubjects.map((subject) => (
                        <li key={subject.subjectId}>{subject.subjectName}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center py-4">
              No students are currently in the high-risk category.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href="/admin/students"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "w-full",
          })}
        >
          View All Students <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
