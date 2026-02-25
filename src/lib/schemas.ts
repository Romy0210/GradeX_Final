import { z } from "zod";

export const studentFormSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  age: z.coerce.number().min(16, "Age must be at least 16").optional(),
  gender: z.enum(["Male", "Female"]),
  phone: z.string().min(10, "Phone number is too short").optional(),
  educationalBackground: z
    .string()
    .min(1, "Educational background is required"),
  batch: z.string().min(1, "Batch is required"),
  class: z.string().min(1, "Class/Department is required"),
  semester: z.string().min(1, "Semester is required"),
  gpa: z.coerce.number().min(0).max(10).optional(),
  subjects: z.array(
    z.object({
      subjectId: z.string(),
      subjectName: z.string(),
      internalMark1: z.coerce.number().min(0, "Min 0").max(40, "Max 40").optional(),
      internalMark2: z.coerce.number().min(0, "Min 0").max(40, "Max 40").optional(),
      totalAssignments: z.coerce.number().int("Must be a whole number").optional(),
      completedAssignments: z.coerce.number().int("Must be a whole number").min(0, "Min 0").optional(),
      subjectAttendancePercentage: z.coerce.number().min(0, "Min 0").max(100, "Max 100").optional(),
    }).superRefine((data, ctx) => {
      const completed = data.completedAssignments ?? 0;
      const total = data.totalAssignments ?? 0;
      if (completed > total) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Cannot exceed total assignments (${total})`,
          path: ['completedAssignments'],
        });
      }
    })
  ).min(1, "At least one subject must be selected for the academic group."),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
