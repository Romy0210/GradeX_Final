"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAcademicStructure } from "@/context/academic-structure-provider";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Student } from "@/lib/data";
import { studentFormSchema, type StudentFormValues } from "@/lib/schemas";
import { Separator } from "@/components/ui/separator";

type EditStudentDialogProps = {
  student: Student;
  onUpdateStudent: (student: Student) => void;
  children: React.ReactNode;
};

export function EditStudentDialog({
  student,
  onUpdateStudent,
  children,
}: EditStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { getSubjectsForGroup } = useAcademicStructure();


  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: student,
  });
  
  const { fields } = useFieldArray({
    control: form.control,
    name: "subjects",
  });
  
  const watchedSubjects = form.watch("subjects");

  const { reset, formState: { isSubmitting } } = form;

  useEffect(() => {
    if (open) {
      const standardSubjects = getSubjectsForGroup(student.batch, student.class, student.semester);
      
      let subjectsForForm: StudentFormValues['subjects'] = [];

      if (standardSubjects.length > 0) {
        subjectsForForm = standardSubjects.map(standardSub => {
            const existingSubject = student.subjects?.find(s => s.subjectId === standardSub.id);
            return {
              subjectId: standardSub.id,
              subjectName: standardSub.name,
              internalMark1: existingSubject?.internalMark1 ?? 0,
              internalMark2: existingSubject?.internalMark2 ?? 0,
              totalAssignments: standardSub.totalAssignments ?? 5,
              completedAssignments: existingSubject?.completedAssignments ?? 0,
              subjectAttendancePercentage: existingSubject?.subjectAttendancePercentage ?? 100,
            };
        });
      } else if (student.subjects) {
          subjectsForForm = student.subjects.map(s => ({
              ...s,
              internalMark1: s.internalMark1 ?? 0,
              internalMark2: s.internalMark2 ?? 0,
              completedAssignments: s.completedAssignments ?? 0,
              totalAssignments: s.totalAssignments ?? 5,
              subjectAttendancePercentage: s.subjectAttendancePercentage ?? 100,
          }));
      }

      reset({
        ...student,
        rollNumber: student.id,
        subjects: subjectsForForm,
      });
    }
  }, [student, open, reset, getSubjectsForGroup]);

  const onSubmit = (data: StudentFormValues) => {
    const { rollNumber, ...studentData } = data;
    
    const standardSubjects = getSubjectsForGroup(student.batch, student.class, student.semester);

    const subjectsWithTotals = (studentData.subjects || []).map(formSubject => {
        const standardSubject = standardSubjects.find(s => s.id === formSubject.subjectId);
        return {
            ...formSubject,
            internalMark1: formSubject.internalMark1 ?? 0,
            internalMark2: formSubject.internalMark2 ?? 0,
            completedAssignments: formSubject.completedAssignments ?? 0,
            totalAssignments: standardSubject?.totalAssignments ?? formSubject.totalAssignments ?? 5,
            subjectAttendancePercentage: formSubject.subjectAttendancePercentage ?? 100,
        };
    });

    const totalMarksPossible = subjectsWithTotals.length * 80; 
    const totalMarksObtained = subjectsWithTotals.reduce((acc, subj) => acc + subj.internalMark1 + subj.internalMark2, 0);

    const overallAverageMarkPercentage = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible) * 100 : 0;
    
    const totalPossibleAssignments = subjectsWithTotals.reduce((acc, s) => acc + s.totalAssignments, 0);
    const totalCompletedAssignments = subjectsWithTotals.reduce((acc, s) => acc + s.completedAssignments, 0);
    
    const assignmentCompletionPercentage =
      totalPossibleAssignments > 0
        ? (totalCompletedAssignments / totalPossibleAssignments) * 100
        : 100;

    const subjectAttendances = subjectsWithTotals.map(s => s.subjectAttendancePercentage);
    const averageAttendance = subjectAttendances.length > 0
        ? subjectAttendances.reduce((acc, a) => acc + a, 0) / subjectAttendances.length
        : 100;

    const updatedStudent: Student = {
      ...student,
      ...studentData,
      age: studentData.age ?? student.age,
      gpa: studentData.gpa ?? student.gpa,
      phone: studentData.phone ?? student.phone,
      subjects: subjectsWithTotals,
      overallAverageMarkPercentage: Math.round(overallAverageMarkPercentage),
      attendancePercentage: Math.round(averageAttendance),
      assignmentCompletion: totalCompletedAssignments,
      pendingAssignments: totalPossibleAssignments - totalCompletedAssignments,
      assignmentCompletionPercentage: Math.round(assignmentCompletionPercentage),
    };

    onUpdateStudent(updatedStudent);

    toast({
      title: "Student Updated",
      description: `${data.name}'s information has been updated and analysis is running.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Student Information</DialogTitle>
          <DialogDescription>
            Update the form below to edit the student's details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.d@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                             onChange={(e) => field.onChange(+e.target.value)}
                             value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="educationalBackground"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Educational Background</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. High School Diploma"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-3 gap-4">
                   <FormField
                    control={form.control}
                    name="batch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class/Dept</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                 <Separator />
                
                <div className="space-y-4">
                  <FormLabel>Subjects, Marks & Assignments</FormLabel>
                  {fields.map((field, index) => {
                      const totalAssignments = watchedSubjects?.[index]?.totalAssignments || 0;
                      const completedAssignmentsValue = watchedSubjects?.[index]?.completedAssignments;
                      const completedAssignments = typeof completedAssignmentsValue === 'number' && !isNaN(completedAssignmentsValue) ? completedAssignmentsValue : 0;
                      const pendingAssignments = totalAssignments - completedAssignments;
                      
                      return (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4">
                           <input
                             type="hidden"
                             {...form.register(`subjects.${index}.totalAssignments`)}
                           />
                          <FormField
                            control={form.control}
                            name={`subjects.${index}.subjectName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject Name</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`subjects.${index}.internalMark1`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Internal Mark 1 (40)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(+e.target.value)}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`subjects.${index}.internalMark2`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Internal Mark 2 (40)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(+e.target.value)}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Separator className="my-2" />
                          <div className="grid grid-cols-2 gap-4 items-start">
                            <FormField
                              control={form.control}
                              name={`subjects.${index}.completedAssignments`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Completed Assignments</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(+e.target.value)}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="text-sm space-y-1 pt-8">
                              <p>Total: <span className="font-semibold">{totalAssignments}</span></p>
                              <p>Pending: <span className="font-semibold">{pendingAssignments < 0 ? 0 : pendingAssignments}</span></p>
                            </div>
                          </div>
                           <FormField
                            control={form.control}
                            name={`subjects.${index}.subjectAttendancePercentage`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Subject Attendance (%)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(+e.target.value)}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        </div>
                      );
                    })}
                   {fields.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center py-4">No subjects configured for this student's academic group.</p>
                  )}
                  <FormMessage>{form.formState.errors.subjects?.root?.message}</FormMessage>
                </div>
                
                 <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA (out of 10)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(+e.target.value)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <p className="text-sm text-muted-foreground mt-4">
                  Overall assignment counts and attendance are calculated automatically from the subject data upon submission.
                </p>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
