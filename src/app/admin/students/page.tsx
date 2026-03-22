'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileUp, ChevronDown, Search, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StudentTable } from '../dashboard/components/student-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { AddStudentDialog } from '../dashboard/components/add-student-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStudentData } from '@/context/student-data-provider';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/lib/data';
import { type StudentFormValues } from '@/lib/schemas';
import { useSettings } from '@/context/settings-provider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAcademicStructure } from '@/context/academic-structure-provider';
import { useActivityLog } from '@/context/activity-log-provider';

const groupStudents = (students: Student[]) => {
  return students.reduce((acc, student) => {
    const { batch, class: className, semester } = student;
    if (!acc[batch]) acc[batch] = {};
    if (!acc[batch][className]) acc[batch][className] = {};
    if (!acc[batch][className][semester]) acc[batch][className][semester] = [];
    acc[batch][className][semester].push(student);
    return acc;
  }, {} as Record<string, Record<string, Record<string, Student[]>>>);
};

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, deleteStudentsBulk, analyzingStudentId, setAnalyzingStudentId } =
    useStudentData();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const studentToDelete = deleteTarget ? students.find(s => s.id === deleteTarget) : null;
  const { modelParameters } = useSettings();
  const { toast } = useToast();
  const { getSubjectsForGroup } = useAcademicStructure();
  const { logActivity } = useActivityLog();


  const [filters, setFilters] = useState({
    search: '',
    batch: 'all',
    class: 'all',
    semester: 'all',
    riskLevel: 'all',
  });

  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{
    type: 'Batch' | 'Class' | 'Semester';
    value: string;
    filters: { batch?: string; class?: string; semester?: string };
  } | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const uniqueBatches = useMemo(
    () => ['all', ...Array.from(new Set(students.map((s) => s.batch)))],
    [students]
  );
  const uniqueClasses = useMemo(
    () => ['all', ...Array.from(new Set(students.map((s) => s.class)))],
    [students]
  );
  const uniqueSemesters = useMemo(
    () => ['all', ...Array.from(new Set(students.map((s) => s.semester)))],
    [students]
  );
  const riskLevels = ['all', 'Low', 'Medium', 'High'];

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const filteredStudents = useMemo(() => {
    const lowercasedSearch = filters.search.toLowerCase();
    return students.filter((student) => {
      const searchMatch =
        filters.search === '' ||
        student.name.toLowerCase().includes(lowercasedSearch) ||
        student.id.toLowerCase().includes(lowercasedSearch);
      const batchMatch =
        filters.batch === 'all' || student.batch === filters.batch;
      const classMatch =
        filters.class === 'all' || student.class === filters.class;
      const semesterMatch =
        filters.semester === 'all' || student.semester === filters.semester;
      const riskMatch =
        filters.riskLevel === 'all' || student.riskLevel === filters.riskLevel;
      return searchMatch && batchMatch && classMatch && semesterMatch && riskMatch;
    });
  }, [students, filters]);

  const groupedStudents = useMemo(
    () => groupStudents(filteredStudents),
    [filteredStudents]
  );

  const runAnalysisForStudent = async (student: Student) => {
    if (analyzingStudentId) return;
    setAnalyzingStudentId(student.id);
    toast({
      title: 'Running AI Analysis...',
      description: `Analyzing data for ${student.name}.`,
    });

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...student, // Pass the whole student object
          highRiskThreshold: modelParameters.highRiskThreshold,
          lowRiskThreshold: modelParameters.lowRiskThreshold,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'API Error', details: response.statusText }));
        throw new Error(
          errorData.details || errorData.error || `API error: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.riskLevel !== student.riskLevel) {
        logActivity(
          "AI_ANALYSIS",
          `AI analysis for '${student.name}' changed risk: ${student.riskLevel} -> ${result.riskLevel}.`
        );
      } else {
        logActivity(
          "AI_ANALYSIS",
          `AI analysis run for '${student.name}'. Risk level remained '${student.riskLevel}'.`
        );
      }

      if (result) {
        updateStudent({ ...student, ...result });
      }
      toast({
        title: 'AI Analysis Complete',
        description: `Updated predictions for ${student.name}.`,
      });
    } catch (error: any) {
      console.error('Failed to generate student report:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setAnalyzingStudentId(null);
    }
  };

  const handleStudentUpdate = (studentFromForm: Student) => {
    logActivity("STUDENT_UPDATE", `Updated details for student '${studentFromForm.name}'.`);
    updateStudent(studentFromForm);
    runAnalysisForStudent(studentFromForm);
  };

  const handleAddStudent = async (data: StudentFormValues) => {
    if (students.some((student) => student.id === data.rollNumber)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Roll Number',
        description: `A student with roll number ${data.rollNumber} already exists. Please use a unique roll number.`,
      });
      return;
    }

    const { rollNumber, ...studentData } = data;
    const standardSubjects = getSubjectsForGroup(studentData.batch, studentData.class, studentData.semester);

    const subjectsWithTotals = (studentData.subjects || []).map(formSubject => {
      const standardSubject = standardSubjects.find(s => s.id === formSubject.subjectId);
      return {
        ...formSubject,
        internalMark1: formSubject.internalMark1 ?? 0,
        internalMark2: formSubject.internalMark2 ?? 0,
        completedAssignments: formSubject.completedAssignments ?? 0,
        totalAssignments: standardSubject?.totalAssignments ?? 5,
        subjectAttendancePercentage: formSubject.subjectAttendancePercentage ?? 100,
      };
    });

    const totalMarksPossible = subjectsWithTotals.length * 80;
    const totalMarksObtained = subjectsWithTotals.reduce((acc, subj) => acc + (subj.internalMark1 ?? 0) + (subj.internalMark2 ?? 0), 0);
    const overallAverageMarkPercentage = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible) * 100 : 0;

    const totalPossibleAssignments = subjectsWithTotals.reduce((acc, s) => acc + (s.totalAssignments ?? 0), 0);
    const totalCompletedAssignments = subjectsWithTotals.reduce((acc, s) => acc + (s.completedAssignments ?? 0), 0);

    const assignmentCompletionPercentage =
      totalPossibleAssignments > 0
        ? (totalCompletedAssignments / totalPossibleAssignments) * 100
        : 0;

    const subjectAttendances = subjectsWithTotals.map(s => s.subjectAttendancePercentage);
    const averageAttendance = subjectAttendances.length > 0
      ? subjectAttendances.reduce((acc, a) => acc + a, 0) / subjectAttendances.length
      : 100;

    const newStudent: Student = {
      name: studentData.name,
      email: studentData.email,
      gender: studentData.gender,
      educationalBackground: studentData.educationalBackground,
      batch: studentData.batch,
      class: studentData.class,
      semester: studentData.semester,
      age: studentData.age ?? 18,
      gpa: studentData.gpa ?? 0,
      phone: studentData.phone ?? "",
      id: rollNumber,
      subjects: subjectsWithTotals,
      profilePhoto: `student-${(students.length % 5) + 1}`,
      bloodGroup: 'N/A',
      overallAverageMarkPercentage: Math.round(overallAverageMarkPercentage),
      attendancePercentage: Math.round(averageAttendance),
      assignmentCompletion: totalCompletedAssignments,
      pendingAssignments: totalPossibleAssignments - totalCompletedAssignments,
      assignmentCompletionPercentage: Math.round(assignmentCompletionPercentage),
      riskLevel: 'Medium',
      outcome: 'Pass',
      gradeCategory: 'C',
      predictionConfidence: 80,
      academicRecommendations: '',
      behavioralRecommendations: '',
      interventionRecommendations: '',
      subjectAnalyses: [],
      subjectRecommendations: [],
    };

    try {
      const savedStudent = await addStudent(newStudent);
      if (!savedStudent) throw new Error("Document ID not returned from Auth provider.");
      logActivity("STUDENT_ADD", `New student '${data.name}' was added to '${data.class} - Sem ${data.semester}'.`);
      runAnalysisForStudent(savedStudent);
      toast({
        title: 'Student Added',
        description: `${data.name} has been created. AI analysis is running.`,
      });
    } catch (error: any) {
      console.error("Failed to add student:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add Student',
        description: error.message?.includes('email-already-in-use')
          ? 'This email address is already in use by another account.'
          : 'An error occurred while creating the student account.',
      });
    }
  };

  const handleReRunAnalysis = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      runAnalysisForStudent(student);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    setDeleteTarget(studentId);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      logActivity("STUDENT_DELETE", `Deleted student record for '${studentToDelete.name}' (${studentToDelete.id}).`);
      deleteStudent(studentToDelete.id);
      toast({
        title: 'Student Deleted',
        description: `${studentToDelete.name} has been removed from the system.`,
      });
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteTarget || confirmText !== `DELETE ${bulkDeleteTarget.value.toUpperCase()}`) return;
    
    setIsDeletingBulk(true);
    try {
      await deleteStudentsBulk(bulkDeleteTarget.filters);
      logActivity("STUDENT_DELETE", `Bulk deleted all students in ${bulkDeleteTarget.type}: ${bulkDeleteTarget.value}.`);
      toast({
        title: 'Bulk Deletion Complete',
        description: `All student records for ${bulkDeleteTarget.type} ${bulkDeleteTarget.value} have been removed.`,
      });
      setBulkDeleteTarget(null);
      setConfirmText('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Bulk Deletion Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and performance data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddStudentDialog onFormSubmit={handleAddStudent} />
          <Button variant="outline" asChild>
            <Link href="/admin/students/bulk-upload">
              <FileUp className="mr-2 h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter students by name, roll no, batch, class, or semester.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="search-filter">Search by Name or Roll No</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-filter"
                placeholder="e.g. Alex Johnson or ST001"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch-filter">Batch</Label>
            <Select value={filters.batch} onValueChange={(value) => handleFilterChange('batch', value)}>
              <SelectTrigger id="batch-filter"><SelectValue placeholder="All Batches" /></SelectTrigger>
              <SelectContent>
                {uniqueBatches.map((batch, index) => <SelectItem key={`${batch}-${index}`} value={batch}>{batch === 'all' ? 'All Batches' : batch}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-filter">Class</Label>
            <Select value={filters.class} onValueChange={(value) => handleFilterChange('class', value)}>
              <SelectTrigger id="class-filter"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                {uniqueClasses.map((cls, index) => <SelectItem key={`${cls}-${index}`} value={cls}>{cls === 'all' ? 'All Classes' : cls}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-filter">Semester</Label>
            <Select value={filters.semester} onValueChange={(value) => handleFilterChange('semester', value)}>
              <SelectTrigger id="semester-filter"><SelectValue placeholder="All Semesters" /></SelectTrigger>
              <SelectContent>
                {uniqueSemesters.map((sem, index) => <SelectItem key={`${sem}-${index}`} value={sem}>{sem === 'all' ? 'All Semesters' : sem}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            A grouped view of all students matching the current filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(groupedStudents).length > 0 ? (
            Object.entries(groupedStudents).map(([batch, classes]) => (
              <Collapsible key={batch} defaultOpen className="group/batch border rounded-lg p-2">
                <div className="flex w-full items-center justify-between rounded-md px-4 py-2 hover:bg-muted/50">
                  <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold flex-1 text-left">
                    <span>Batch: {batch}</span>
                    <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBulkDeleteTarget({ type: 'Batch', value: batch, filters: { batch } });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Batch
                  </Button>
                </div>
                <CollapsibleContent className="space-y-2 py-2 pl-4">
                  {Object.entries(classes).map(([className, semesters]) => (
                    <Collapsible key={className} defaultOpen className="group/class border-l pl-2">
                      <div className="flex w-full items-center justify-between rounded-md px-4 py-2 hover:bg-muted/30">
                        <CollapsibleTrigger className="flex items-center gap-2 text-md font-medium flex-1 text-left">
                          <span>Class: {className}</span>
                          <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBulkDeleteTarget({ type: 'Class', value: className, filters: { batch, class: className } });
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Class
                        </Button>
                      </div>
                      <CollapsibleContent className="space-y-2 py-2 pl-4">
                        {Object.entries(semesters).map(([semester, studentsInGroup]) => (
                          <Collapsible key={semester} defaultOpen className="group/semester">
                            <div className="flex w-full items-center justify-between rounded-md px-4 py-1 hover:bg-muted/20">
                              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold flex-1 text-left">
                                <span>Semester: {semester}</span>
                                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                              </CollapsibleTrigger>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBulkDeleteTarget({ type: 'Semester', value: semester, filters: { batch, class: className, semester } });
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete Sem
                              </Button>
                            </div>
                            <CollapsibleContent className="pt-2">
                              <StudentTable
                                data={studentsInGroup}
                                onUpdateStudent={handleStudentUpdate}
                                onReRunAnalysis={handleReRunAnalysis}
                                onDeleteStudent={handleDeleteStudent}
                                analyzingStudentId={analyzingStudentId}
                              />
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No students found for the selected criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student record for {studentToDelete?.name ?? 'this student'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                setDeleteTarget(null);
                setTimeout(() => {
                  confirmDelete();
                }, 200);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteTarget !== null} onOpenChange={(open) => { if (!open) { setBulkDeleteTarget(null); setConfirmText(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Critical: Bulk Deletion</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left" asChild>
            <div className="pt-2">
              <p>
                You are about to delete <strong>ALL</strong> students in <strong>{bulkDeleteTarget?.type}: {bulkDeleteTarget?.value}</strong>.
                This action is irreversible and will remove all academic records for these students.
              </p>
              <div className="space-y-2 mt-4">
                <Label htmlFor="confirm-delete">To confirm, type <strong>DELETE {bulkDeleteTarget?.value.toUpperCase()}</strong> below:</Label>
                <Input
                  id="confirm-delete"
                  placeholder={`DELETE ${bulkDeleteTarget?.value.toUpperCase()}`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="border-destructive"
                />
              </div>
            </div>
          </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingBulk}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={confirmText !== `DELETE ${bulkDeleteTarget?.value.toUpperCase()}` || isDeletingBulk}
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
            >
              {isDeletingBulk ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Permanently Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
