'use client';

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCorrectionRequests } from "@/context/correction-request-provider";
import type { Student } from "@/lib/data";

const formSchema = z.object({
  field: z.string().min(1, "Please select a field to correct"),
  subjectId: z.string().optional(),
  description: z.string().min(10, "Please provide a more detailed description (min 10 chars)"),
  oldValue: z.string().optional(),
  newValue: z.string().min(1, "Please provide the correct value"),
});

interface ReportErrorDialogProps {
  student: Student;
}

export function ReportErrorDialog({ student }: ReportErrorDialogProps) {
  const [open, setOpen] = useState(false);
  const { createRequest } = useCorrectionRequests();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field: "",
      subjectId: "",
      description: "",
      oldValue: "",
      newValue: "",
    },
  });

  const selectedField = useWatch({
    control: form.control,
    name: "field",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let finalField = values.field;
      if (values.field === "Subject-wise Entries" && values.subjectId) {
        const subject = student.subjects.find(s => s.subjectId === values.subjectId);
        finalField = `Subject Error: ${subject?.subjectName || values.subjectId}`;
      }

      await createRequest({
        studentId: student.id,
        field: finalField,
        description: values.description,
        oldValue: values.oldValue || "N/A",
        newValue: values.newValue,
      });
      
      toast({
        title: "Request Submitted",
        description: "Your correction request has been sent to the Admin for review.",
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertCircle className="mr-2 h-4 w-4" />
          Report Academic Error
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Academic Data Error</DialogTitle>
          <DialogDescription>
            Found a mistake in your records? Submit a correction request here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorrect Field category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Internal Marks">Internal Marks</SelectItem>
                      <SelectItem value="Attendance">Attendance Percentage</SelectItem>
                      <SelectItem value="Assignments">Assignment Status</SelectItem>
                      <SelectItem value="Subject-wise Entries">Subject-wise Entries</SelectItem>
                      <SelectItem value="Personal Details">Personal Details</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedField === "Subject-wise Entries" && (
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Which subject has the error?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {student.subjects.map((s) => (
                          <SelectItem key={s.subjectId} value={s.subjectId}>
                            {s.subjectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="oldValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 75%" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Value</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 85%" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason / Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please explain why the current data is incorrect (e.g. 'I submitted my assignment on date X but it shows as pending')." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
