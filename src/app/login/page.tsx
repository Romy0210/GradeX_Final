'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GradeXLogo, GoogleIcon } from '@/components/icons';
import { useAuth, useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'admin'>('student');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * This function handles the entire login flow, including the crucial step
   * of creating a user profile document in Firestore if one doesn't already exist.
   * This ensures that every authenticated user has a corresponding data record
   * that stores their role and other application-specific information.
   * @param {LoginFormValues} data - The user's email and password from the login form.
   */
  const handleLogin = async (data: LoginFormValues) => {
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
      // Step 1: Authenticate the user with Firebase Auth.
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;
      
      // Step 2: Check for an existing user profile in Firestore.
      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      let userRole: 'admin' | 'student' = 'student';
      if (docSnap.exists()) {
        // Step 3a: If a profile exists, use the role from the database.
        userRole = docSnap.data().role;
      } else {
        // Step 3b: If no profile exists, create one. This is critical for new users.
        // The role is determined based on the email (for the default admin) or defaults to "student".
        if (user.email === 'admin@gradex.pro') {
          userRole = 'admin';
        }
        await setDoc(
          userDocRef,
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || '',
            role: userRole,
          },
          { merge: true }
        );
      }
      
      // Step 4: Validate that the user is logging into the correct role-based portal.
      if (role !== userRole) {
        toast({
          variant: 'destructive',
          title: 'Role Mismatch',
          description: `You are trying to log in as a ${role}, but your account is a ${userRole} account.`,
        });
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // Step 5: Redirect to the appropriate dashboard.
      toast({
        title: 'Login Successful',
        description: 'Redirecting to your dashboard...',
      });

      if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Configured',
        description: 'Authentication services are currently unavailable.',
      });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      let userRole: 'admin' | 'student' = 'student';
      if (docSnap.exists()) {
        userRole = docSnap.data().role;
      } else {
        if (user.email === 'admin@gradex.pro') {
          userRole = 'admin';
        }
        await setDoc(
          userDocRef,
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: userRole,
          },
          { merge: true }
        );
      }

      if (role !== userRole) {
        toast({
          variant: 'destructive',
          title: 'Role Mismatch',
          description: `You are trying to log in as a ${role}, but your Google account is registered as a ${userRole}.`,
        });
        await auth.signOut();
        setIsGoogleLoading(false);
        return;
      }

      toast({
        title: 'Login Successful',
        description: `Welcome, ${user.displayName}!`,
      });

      if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-md mx-auto rounded-xl border bg-card text-card-foreground p-8 shadow-lg">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="flex items-center gap-3">
            <GradeXLogo className="h-10 w-10 text-primary" />
            <span className="text-4xl font-bold">GradeX</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-balance text-muted-foreground">
            Select your role to sign in to your dashboard
          </p>
        </div>

        <Tabs
          defaultValue="student"
          onValueChange={(v) => setRole(v as 'student' | 'admin')}
          className="w-full mb-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit(handleLogin)} className="grid gap-4">
          <div className="grid gap-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...register('email')}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2 text-left">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </div>

        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
      </div>
    </div>
  );
}
