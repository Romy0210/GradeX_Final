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
import { ScrollArea } from "@/components/ui/scroll-area";
import { studentFormSchema, type StudentFormValues } from "@/lib/schemas";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Loader2 } from "lucide-react";

type AddStudentDialogProps = {
  onFormSubmit: (data: StudentFormValues) => void;
};

export function AddStudentDialog({
  onFormSubmit,
}: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const { configurations, getSubjectsForGroup } = useAcademicStructure();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      rollNumber: "",
      name: "",
      email: "",
      age: 18,
      gender: "Male",
      phone: "",
      educationalBackground: "High School Diploma",
      batch: "",
      class: "",
      semester: "",
      gpa: 0,
      subjects: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "subjects",
  });

  const watchedBatch = form.watch("batch");
  const watchedClass = form.watch("class");
  const watchedSemester = form.watch("semester");
  const watchedSubjects = form.watch("subjects");

  useEffect(() => {
    if (watchedBatch && watchedClass && watchedSemester) {
      const standardSubjects = getSubjectsForGroup(watchedBatch, watchedClass, watchedSemester);
      const newSubjects = standardSubjects.map(sub => ({
        subjectId: sub.id,
        subjectName: sub.name,
        internalMark1: 0,
        internalMark2: 0,
        totalAssignments: sub.totalAssignments ?? 5,
        completedAssignments: 0,
        subjectAttendancePercentage: 100,
      }));
      replace(newSubjects);
    } else {
      replace([]);
    }
  }, [watchedBatch, watchedClass, watchedSemester, getSubjectsForGroup, replace]);


  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      await onFormSubmit(data);
      setOpen(false);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueBatches = [...new Set(configurations.map((c) => c.batch))];
  const uniqueClasses = [...new Set(configurations.map((c) => c.class))];
  const uniqueSemesters = [...new Set(configurations.map((c) => c.semester))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new student to the system.
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
                        <Input placeholder="ST006" {...field} />
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
                            onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                            value={field.value ?? ''}
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
                          defaultValue={field.value}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger></FormControl>
                          <SelectContent>{uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger></FormControl>
                          <SelectContent>{uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger></FormControl>
                          <SelectContent>{uniqueSemesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <FormLabel>Subjects & Marks</FormLabel>
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
                                    step="any"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
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
                                    step="any"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
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
                                    step="1"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
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
                                  step="any"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )
                  })}
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Select batch, class, and semester to load subjects.</p>
                  ) : null}
                  <FormMessage>{form.formState.errors.subjects?.root?.message}</FormMessage>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA (out of 10)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value ?? ''}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Student
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
