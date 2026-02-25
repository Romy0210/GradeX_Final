"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  BrainCircuit,
  Loader2,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Student, StudentSubjectAnalysis } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { EditStudentDialog } from "./edit-student-dialog";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type StudentTableProps = {
  data: Student[];
  onUpdateStudent: (student: Student) => void;
  onReRunAnalysis: (studentId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  analyzingStudentId: string | null;
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


const SubjectPerformanceDetails = ({ subjects }: { subjects: StudentSubjectAnalysis[] }) => {
  if (!subjects || subjects.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">No subject-wise analysis available for this student.</div>;
  }

  return (
    <div className="p-4 bg-muted/20 space-y-4">
      <h4 className="font-semibold text-md">Subject Enrollment & Performance</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(subject => (
          <div key={subject.subjectId} className="p-3 border rounded-lg bg-background/50">
            <p className="font-semibold mb-2">{subject.subjectName}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk:</span>
                <Badge variant={getRiskBadgeVariant(subject.riskLevel)}>{subject.riskLevel}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outcome:</span>
                <span className="font-medium">{subject.outcome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <Badge variant="outline">{subject.gradeCategory}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export function StudentTable({
  data,
  onUpdateStudent,
  onReRunAnalysis,
  onDeleteStudent,
  analyzingStudentId,
}: StudentTableProps) {
  const isAnyAnalysisRunning = analyzingStudentId !== null;
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // State-driven dialogs — kept at root level to avoid portal orphaning
  const [editTarget, setEditTarget] = useState<Student | null>(null);

  const toggleRow = (studentId: string) => {
    setExpandedRows(prev => {
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
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Risk Level</TableHead>
            <TableHead className="hidden md:table-cell">Outcome</TableHead>
            <TableHead className="hidden md:table-cell">Grade</TableHead>
            <TableHead className="hidden md:table-cell">GPA</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((student) => {
            const profilePhoto = PlaceHolderImages.find(
              (p) => p.id === student.profilePhoto
            );
            const isAnalyzingThisStudent = analyzingStudentId === student.id;
            const isExpanded = expandedRows.has(student.id);

            return (
              <React.Fragment key={student.id}>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleRow(student.id)} className="h-8 w-8">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="sr-only">Toggle subject details</span>
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profilePhoto?.imageUrl}
                          alt={student.name}
                        />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{student.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRiskBadgeVariant(student.riskLevel)}>
                      {student.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {student.outcome}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{student.gradeCategory}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {student.gpa.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isAnyAnalysisRunning}
                        >
                          {isAnalyzingThisStudent ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/student/${student.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Analysis
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setEditTarget(student)}
                          disabled={isAnyAnalysisRunning}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            // Delay triggering the AlertDialog until the DropdownMenu has fully closed
                            // This prevents Radix UI from racing `pointer-events: none` on the document body
                            setTimeout(() => {
                              onDeleteStudent(student.id)
                            }, 50);
                          }}
                          disabled={isAnyAnalysisRunning}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuItem
                              onSelect={() => onReRunAnalysis(student.id)}
                              disabled={isAnyAnalysisRunning}
                            >
                              {isAnalyzingThisStudent ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <BrainCircuit className="mr-2 h-4 w-4" />
                              )}
                              {isAnalyzingThisStudent
                                ? "Analyzing..."
                                : "Re-run AI Analysis"}
                            </DropdownMenuItem>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Trigger AI predictions manually</p>
                          </TooltipContent>
                        </Tooltip>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {isExpanded && student.subjectAnalyses && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={6} className="p-0">
                      <SubjectPerformanceDetails subjects={student.subjectAnalyses} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>



      {/* Edit dialog — rendered at root level to avoid portal orphaning */}
      {editTarget && (
        <EditStudentDialog
          student={editTarget}
          onUpdateStudent={(updated) => {
            onUpdateStudent(updated);
            // DO NOT immediately setEditTarget(null) here, as it unmounts the Dialog instanly 
            // before Radix UI can restore pointer-events to the body.
          }}
          defaultOpen
          onOpenChange={(open) => {
            if (!open) {
              // Delay unmounting to let the close animation finish and pointer-events be restored
              setTimeout(() => setEditTarget(null), 300);
            }
          }}
        />
      )}
    </TooltipProvider>
  );
}
