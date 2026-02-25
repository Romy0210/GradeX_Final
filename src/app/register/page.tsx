'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GradeXLogo } from '@/components/icons';
import { useAuth, useFirestore } from '@/firebase';
import { useAcademicStructure } from '@/context/academic-structure-provider';
import { useStudentData } from '@/context/student-data-provider';
import { Loader2 } from 'lucide-react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Student } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ============================
   VALIDATION SCHEMA
============================ */

const baseSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
});

const adminSchema = baseSchema.extend({
  role: z.literal('admin'),
});

const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  age: z.coerce.number().min(16, 'Minimum age is 16'),
  gender: z.enum(['Male', 'Female']),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  educationalBackground: z.string().min(1, 'Required'),
  batch: z.string().min(1, 'Required'),
  class: z.string().min(1, 'Required'),
  semester: z.string().min(1, 'Required'),
});

const registerSchema = z.discriminatedUnion('role', [adminSchema, studentSchema]);

type RegisterFormValues = z.infer<typeof registerSchema>;

/* ============================
   COMPONENT
============================ */

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { addStudent, students } = useStudentData();
  const { configurations } = useAcademicStructure();

  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'admin'>('student');

  /* ============================
     DEBUG INITIALIZATION
  ============================ */

  useEffect(() => {
    console.log('🔥 Auth:', auth);
    console.log('🔥 Firestore:', firestore);
    console.log('🔥 Academic Configurations:', configurations);
  }, [auth, firestore, configurations]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: 18,
      gender: 'Male',
      phone: '',
      educationalBackground: '',
      batch: '',
      class: '',
      semester: '',
    },
  });

  /* ============================
     UNIQUE DROPDOWN VALUES
  ============================ */

  const uniqueBatches = useMemo(() => {
    console.log('🔎 Calculating unique batches');
    return [...new Set(configurations.map((c) => c.batch))];
  }, [configurations]);

  const uniqueClasses = useMemo(() => {
    console.log('🔎 Calculating unique classes');
    return [...new Set(configurations.map((c) => c.class))];
  }, [configurations]);

  const uniqueSemesters = useMemo(() => {
    console.log('🔎 Calculating unique semesters');
    return [...new Set(configurations.map((c) => c.semester))];
  }, [configurations]);

  /* ============================
     ROLE CHANGE
  ============================ */

  const handleRoleChange = (newRole: 'student' | 'admin') => {
    console.log('🔁 Role changed to:', newRole);
    setRole(newRole);
    form.setValue('role', newRole);
  };

  /* ============================
     REGISTER HANDLER
  ============================ */

  const handleRegister = async (data: RegisterFormValues) => {
    console.log('🚀 Register clicked');
    console.log('📦 Form Data:', data);

    if (data.password !== data.confirmPassword) {
      form.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }

    if (!auth) {
      console.error('❌ Auth not initialized');
      return;
    }

    if (!firestore) {
      console.error('❌ Firestore not initialized');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Creating user in Firebase...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );

      console.log('✅ User created:', userCredential);

      const user = userCredential.user;

      console.log('📝 Updating profile...');
      await updateProfile(user, {
        displayName: data.fullName,
      });

      console.log('📄 Saving user to Firestore...');
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: data.fullName,
        role: data.role,
        createdAt: serverTimestamp(),
      });

      console.log('✅ Firestore save complete');

      if (data.role === 'student') {
        const studentData = data as any;
        const newStudent: Student = {
          id: user.uid, // Use the auth UID as the document ID
          name: studentData.fullName,
          email: studentData.email,
          age: studentData.age,
          gender: studentData.gender,
          phone: studentData.phone,
          educationalBackground: studentData.educationalBackground,
          batch: studentData.batch,
          class: studentData.class,
          semester: studentData.semester,
          profilePhoto: `student-${(students.length % 5) + 1}`,
          bloodGroup: 'N/A',
          gpa: 0,
          subjects: [],
          overallAverageMarkPercentage: 0,
          attendancePercentage: 100,
          assignmentCompletion: 0,
          pendingAssignments: 0,
          assignmentCompletionPercentage: 0,
          riskLevel: 'Medium',
          outcome: 'Pass',
          gradeCategory: 'C',
        };

        console.log('➕ Adding student document to Firestore:', newStudent);
        await setDoc(doc(firestore, 'students', user.uid), newStudent);
      }

      toast({
        title: 'Account Created',
        description: 'Redirecting to login...',
      });

      console.log('➡️ Redirecting...');
      router.push('/login');
    } catch (error: any) {
      console.error('🔥 Registration Error:', error);
      console.error('🔥 Firebase Error Code:', error?.code);

      let description = 'An unexpected error occurred. Please try again.';
      switch (error?.code) {
        case 'auth/email-already-in-use':
          description = 'This email is already registered. Please log in or use a different email.';
          break;
        case 'auth/weak-password':
          description = 'Password is too weak. Please use at least 8 characters.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is invalid. Please check and try again.';
          break;
        case 'auth/network-request-failed':
          description = 'Network error. Please check your connection and try again.';
          break;
        case 'auth/too-many-requests':
          description = 'Too many attempts. Please wait a moment and try again.';
          break;
      }

      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description,
      });
    } finally {
      console.log('🛑 Registration finished');
      setIsLoading(false);
    }
  };

  /* ============================
     JSX
  ============================ */

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <GradeXLogo className="h-10 w-10 text-primary mb-2" />
          <h1 className="text-3xl font-bold">Create Account</h1>
        </div>

        <Tabs
          defaultValue="student"
          onValueChange={(v) =>
            handleRoleChange(v as 'student' | 'admin')
          }
          className="mb-6"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              handleRegister,
              (errors) => console.error('❌ Validation Errors:', errors)
            )}
            className="grid gap-4"
          >
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {/* Basic Fields */}

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Student Fields */}

                {role === 'student' && (
                  <>
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                                <SelectValue placeholder="Select Gender" />
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

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Batch */}
                    <FormField
                      control={form.control}
                      name="batch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Batch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {uniqueBatches.map((b) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Class */}
                    <FormField
                      control={form.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {uniqueClasses.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Semester */}
                    <FormField
                      control={form.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {uniqueSemesters.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </ScrollArea>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6"
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}