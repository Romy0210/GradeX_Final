"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAcademicStructure } from "@/context/academic-structure-provider";
import { useToast } from "@/hooks/use-toast";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const groupSchema = z.object({
  batch: z.string().min(1, "Batch is required."),
  class: z.string().min(1, "Class/Department is required."),
  semester: z.string().min(1, "Semester is required."),
});

type GroupFormValues = z.infer<typeof groupSchema>;

export function CreateAcademicGroupDialog() {
  const [open, setOpen] = useState(false);
  const { createAcademicGroup } = useAcademicStructure();
  const { toast } = useToast();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { batch: "", class: "", semester: "" },
  });

const onSubmit = async (data: GroupFormValues) => {
  const success = await createAcademicGroup(data);

  if (success) {
    toast({
      title: "Academic Group Created",
      description: `${data.batch} - ${data.class} - Semester ${data.semester} has been added.`,
    });
    setOpen(false);
    form.reset();
  } else {
    toast({
      variant: "destructive",
      title: "Group Already Exists",
      description: "An academic group with this batch, class, and semester already exists.",
    });
  }
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Academic Group</DialogTitle>
          <DialogDescription>
            Register a new academic group (e.g., a new semester for an existing class).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="batch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch (e.g., 2021-2025)</FormLabel>
                  <FormControl>
                    <Input placeholder="2021-2025" {...field} />
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
                  <FormLabel>Class / Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Computer Science" {...field} />
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
                    <Input placeholder="6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
