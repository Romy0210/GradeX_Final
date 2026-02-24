'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GradeXLogo } from '@/components/icons';
import { useAuth, useFirestore } from '@/firebase';
import { useAcademicStructure } from '@/context/academic-structure-provider';
import { useStudentData } from '@/context/student-data-provider';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Student } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';

const registerSchema = z.object({
    role: z.enum(['student', 'admin']),
    fullName: z.string().min(3, 'Full name must be at least 3 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string(),
    // Student-specific fields
    age: z.coerce.number().min(16, 'You must be at least 16 years old.').optional(),
    gender: z.enum(['Male', 'Female']).optional(),
    phone: z.string().min(10, 'Please enter a valid phone number.').optional(),
    educationalBackground: z.string().min(1, 'Educational background is required.').optional(),
    batch: z.string().min(1, 'Batch is required.').optional(),
    class: z.string().min(1, 'Class/Department is required.').optional(),
    semester: z.string().min(1, 'Semester is required.').optional(),
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
})
.refine((data) => {
    if (data.role === 'student') {
        return !!data.age && !!data.gender && !!data.phone && !!data.educationalBackground && !!data.batch && !!data.class && !!data.semester;
    }
    return true;
}, {
    message: "All student fields are required.",
    path: ["semester"], // Arbitrarily attach to a student-only field
});


type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();
    const { addStudent, students: existingStudents } = useStudentData();
    const { configurations } = useAcademicStructure();
    
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<'student' | 'admin'>('student');

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'student',
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            // Student fields
            age: 18,
            gender: 'Male',
            phone: '',
            educationalBackground: '',
            batch: '',
            class: '',
            semester: '',
        }
    });

    const uniqueBatches = [...new Set(configurations.map(c => c.batch))];
    const uniqueClasses = [...new Set(configurations.map(c => c.class))];
    const uniqueSemesters = [...new Set(configurations.map(c => c.semester))];

    const handleRoleChange = (newRole: 'student' | 'admin') => {
        setRole(newRole);
        form.setValue('role', newRole);
    }
    
    const handleRegister = async (data: RegisterFormValues) => {
        if (!auth || !firestore) {
          toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Authentication services are currently unavailable.',
          });
          return;
        }
        setIsLoading(true);

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // 2. Update Auth profile
            await updateProfile(user, { displayName: data.fullName });

            // 3. Create user profile document in Firestore
            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: data.fullName,
                photoURL: user.photoURL || '',
                role: data.role,
            });

            // 4. If student, create a corresponding student record
            if (data.role === 'student' && data.batch && data.class && data.semester) {
                 const newStudent: Student = {
                    id: `ST${100 + existingStudents.length + 1}`, // Generate a pseudo-unique roll number
                    name: data.fullName,
                    email: data.email,
                    age: data.age!,
                    gender: data.gender!,
                    phone: data.phone!,
                    educationalBackground: data.educationalBackground!,
                    batch: data.batch,
                    class: data.class,
                    semester: data.semester,
                    profilePhoto: `student-${(existingStudents.length % 5) + 1}`,
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
                    gradeCategory: 'N/A',
                };
                addStudent(newStudent);
            }

            toast({
                title: 'Account Created Successfully',
                description: "We're redirecting you to the login page.",
            });
            router.push('/login');

        } catch (error: any) {
            let description = "An unexpected error occurred.";
            if (error.code === 'auth/email-already-in-use') {
                description = "This email address is already registered. Please try logging in.";
            } else if (error.code === 'auth/weak-password') {
                description = "The password is too weak. Please use at least 8 characters.";
            }
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description,
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-2xl mx-auto rounded-xl border bg-card text-card-foreground p-8 shadow-lg">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="flex items-center gap-3">
            <GradeXLogo className="h-10 w-10 text-primary" />
            <span className="text-4xl font-bold">GradeX</span>
          </div>
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-balance text-muted-foreground">
            Select your role and fill in your details to get started.
          </p>
        </div>

        <Tabs
          defaultValue="student"
          onValueChange={(v) => handleRoleChange(v as 'student' | 'admin')}
          className="w-full mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">I am a Student</TabsTrigger>
            <TabsTrigger value="admin">I am an Administrator</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="grid gap-4">
                <ScrollArea className="h-[50vh] pr-4">
                    <div className="space-y-4">
                        <FormField control={form.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <div className="grid md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        
                        {role === 'student' && (
                            <>
                                <div className="grid md:grid-cols-2 gap-4">
                                     <FormField control={form.control} name="age" render={({ field }) => (
                                        <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="gender" render={({ field }) => (
                                        <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                    )} />
                                </div>
                                 <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="123-456-7890" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="educationalBackground" render={({ field }) => (
                                    <FormItem><FormLabel>Educational Background</FormLabel><FormControl><Input placeholder="e.g. High School Diploma" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="batch" render={({ field }) => (
                                        <FormItem><FormLabel>Batch</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger></FormControl><SelectContent>{uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="class" render={({ field }) => (
                                        <FormItem><FormLabel>Class/Dept</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger></FormControl><SelectContent>{uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="semester" render={({ field }) => (
                                        <FormItem><FormLabel>Semester</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger></FormControl><SelectContent>{uniqueSemesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                    )} />
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
            </form>
        </Form>

         <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
