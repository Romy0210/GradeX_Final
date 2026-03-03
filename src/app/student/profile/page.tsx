'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useStudentData } from '@/context/student-data-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Camera, User, Mail, Landmark, Phone, Calendar, GitBranch, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getAuth, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 characters.").optional(),
  age: z.coerce.number().min(16, "Age must be at least 16."),
  gender: z.enum(["Male", "Female"]),
  educationalBackground: z.string().min(1, "Educational background is required."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;


export default function StudentProfilePage() {
  const { user, userProfile, isLoading: isUserLoading } = useUser();
  const { students, updateStudent, findStudentById } = useStudentData();
  const [studentData, setStudentData] = useState<ReturnType<typeof findStudentById>>(undefined);

  const app = useFirebaseApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && students.length > 0) {
      setStudentData(students.find(s => s.authUid === user.uid) || students.find(s => s.id === user.uid) || null);
    }
  }, [user, students]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      age: 18,
      gender: 'Male',
      educationalBackground: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (studentData) {
      form.reset({
        name: studentData.name || '',
        phone: studentData.phone || '',
        age: studentData.age || 18,
        gender: studentData.gender || 'Male',
        educationalBackground: studentData.educationalBackground || '',
      });
    }
  }, [studentData, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a JPG or PNG image.' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Image size cannot exceed 2MB.' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore || !app || !studentData) {
      toast({ variant: "destructive", title: "Error", description: "User or Firebase services not available." });
      return;
    }

    setIsSaving(true);

    try {
      const auth = getAuth(app);
      const storage = getStorage(app);

      const hasPhotoChanged = imageFile !== null;

      if (!isDirty && !hasPhotoChanged) {
        toast({ title: "No changes to save." });
        setIsSaving(false);
        return;
      }

      const authUpdates: { displayName?: string; photoURL?: string } = {};
      const firestoreUpdates: { [key: string]: any } = {};

      if (hasPhotoChanged && imageFile) {
        const fileRef = storageRef(storage, `avatars/${user.uid}`);
        const snapshot = await uploadBytes(fileRef, imageFile);
        const newPhotoURL = await getDownloadURL(snapshot.ref);
        authUpdates.photoURL = newPhotoURL;
        firestoreUpdates.photoURL = newPhotoURL;
      }

      if (isDirty) {
        if (data.name !== studentData.name) {
          authUpdates.displayName = data.name;
        }
        firestoreUpdates.displayName = data.name;
        firestoreUpdates.phone = data.phone;
        firestoreUpdates.age = data.age;
        firestoreUpdates.gender = data.gender;
        firestoreUpdates.educationalBackground = data.educationalBackground;
      }

      // Update Firebase Auth
      if (Object.keys(authUpdates).length > 0 && auth.currentUser) {
        await updateProfile(auth.currentUser, authUpdates);
      }

      // Update Firestore `users` collection
      if (Object.keys(firestoreUpdates).length > 0) {
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, firestoreUpdates, { merge: true });
      }

      // Update student data in local state/storage to keep UI in sync
      updateStudent({
        ...studentData,
        ...data,
      });


      toast({ title: "Profile updated successfully" });
      resetImageSelection();
      form.reset(data, { keepIsDirty: false });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to change your password.' });
      return;
    }

    setIsPasswordSaving(true);
    const auth = getAuth();
    if (!user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'User email not found.' });
      setIsPasswordSaving(false);
      return;
    }
    const credential = EmailAuthProvider.credential(user.email, data.currentPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);

      toast({ title: 'Password updated successfully' });
      passwordForm.reset();
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/invalid-credential') {
        description = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The new password is too weak. Please choose a stronger password.';
      }
      toast({
        variant: 'destructive',
        title: 'Password Change Failed',
        description: description,
      });
    } finally {
      setIsPasswordSaving(false);
    }
  }


  if (isUserLoading || studentData === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (studentData === null) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Could not find student data for {user?.email}.</p>
      </div>
    )
  }

  const lastLogin = user?.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString()
    : 'Not available';

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile settings.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
            <CardDescription>
              Your personal and academic information.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={imagePreview ?? userProfile?.photoURL ?? user?.photoURL ?? undefined} />
                  <AvatarFallback>{studentData.name?.[0] || 'S'}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-card" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">{form.watch('name')}</h2>
                <p className="text-muted-foreground">{studentData.email}</p>
                <Badge variant="outline" className="mt-2 capitalize">{userProfile?.role}</Badge>
              </div>
              <div className="flex flex-col items-center">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG / PNG • Max 2MB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                />
                {imagePreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetImageSelection} className="mt-2 text-xs">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-muted-foreground">Email</p><p className="font-semibold">{studentData.email}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-muted-foreground">Role</p><p className="font-semibold capitalize">{userProfile?.role}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-muted-foreground">Last Login</p><p className="font-semibold">{lastLogin}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-muted-foreground">Batch</p><p className="font-semibold">{studentData.batch}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-muted-foreground">Class / Dept</p><p className="font-semibold">{studentData.class}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>
              Change your personal information. Email and Roll Number cannot be changed.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  name="educationalBackground"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Educational Background</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. High School Diploma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                <Button type="submit" disabled={(!isDirty && !imageFile) || isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Change Password</CardTitle>
            <CardDescription>
              Update your account password.
            </CardDescription>
          </CardHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 8 characters long.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isPasswordSaving}>
                  {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </>
  );
}
