'use client';

import { useUser } from '@/firebase/auth/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { uploadProfilePhoto } from '@/supabase/storage';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';

const profileFormSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function AdminProfilePage() {
  const { user, userProfile, isLoading } = useUser();
  const app = useFirebaseApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
    },
  });
  
  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || '',
      });
    }
  }, [userProfile, form]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a JPG or PNG image.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Image size cannot exceed 10MB.' });
      return;
    }

    if (!user || !firestore || !app) {
      toast({ variant: 'destructive', title: 'Error', description: 'Services not ready. Please try again.' });
      return;
    }

    // Show local preview immediately
    setImagePreview(URL.createObjectURL(file));
    setIsUploadingPhoto(true);
    toast({ title: 'Uploading photo...', description: 'Your profile picture is being saved to Supabase.' });

    try {
      const auth = getAuth(app);

      // Upload to Supabase Storage
      const newPhotoURL = await uploadProfilePhoto(user.uid, file);

      // Update Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      }

      // Update Firestore users collection
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });

      setImagePreview(newPhotoURL);
      toast({ title: 'Profile photo saved!', description: 'Your new profile picture is live.' });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      setImagePreview(null);
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Check browser console for details.' });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const resetImageSelection = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore || !app) {
        toast({ variant: "destructive", title: "Error", description: "User or Firebase services not available." });
        return;
    }
    
    setIsSaving(true);
    
    try {
        const auth = getAuth(app);

        const hasNameChanged = isDirty && data.displayName !== userProfile?.displayName;

        if (!hasNameChanged) {
            toast({ title: "No changes to save." });
            setIsSaving(false);
            return;
        }

        const authUpdates: { displayName?: string } = {};
        const firestoreUpdates: { displayName?: string } = {};

        if (hasNameChanged) {
            authUpdates.displayName = data.displayName;
            firestoreUpdates.displayName = data.displayName;
        }

        if (Object.keys(authUpdates).length > 0 && auth.currentUser) {
            await updateProfile(auth.currentUser, authUpdates);
        }
        
        if (Object.keys(firestoreUpdates).length > 0) {
            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, firestoreUpdates, { merge: true });
        }

        toast({ title: "Profile updated successfully" });
        resetImageSelection();
        form.reset(data, { keepDirty: false });

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

  if (isLoading || !user || !userProfile) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const lastLogin = user.metadata.lastSignInTime 
    ? new Date(user.metadata.lastSignInTime).toLocaleString() 
    : 'Not available';

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile settings.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={imagePreview ?? userProfile?.photoURL ?? user.photoURL ?? undefined} />
                  <AvatarFallback>{userProfile?.displayName?.[0] || user.email?.[0]}</AvatarFallback>
                </Avatar>
                {isUploadingPhoto ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                ) : (
                  <span className="absolute bottom-1 right-1 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-card" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">{form.watch('displayName')}</h2>
                <p className="text-muted-foreground">{userProfile.email}</p>
                <Badge variant="outline" className="mt-2 capitalize">{userProfile.role}</Badge>
              </div>
              <div className="flex flex-col items-center">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG / PNG • Max 10MB</p>
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
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Account Metadata</CardTitle>
                <CardDescription>Read-only information about your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="flex flex-col space-y-1">
                        <p className="text-muted-foreground">Account Status</p>
                        <p className="font-semibold text-green-400">Active</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <p className="text-muted-foreground">Last Login</p>
                        <p className="font-semibold">{lastLogin}</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <p className="text-muted-foreground">Account Type</p>
                        <p className="font-semibold capitalize">{userProfile.role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Update Profile</CardTitle>
                <CardDescription>
                    Change your display name.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your display name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-4">
                        <Button type="submit" disabled={!isDirty || isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Email and role are managed by the system and cannot be changed.
                        </p>
                    </CardFooter>
                </form>
            </Form>
        </Card>
      </div>
    </>
  );
}
