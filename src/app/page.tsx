'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isLoading) {
      if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.role === 'admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/student/dashboard');
            }
          } else {
            // Handle case where user doc doesn't exist but they are authenticated
            // For now, default to student dashboard
             router.push('/student/dashboard');
          }
        });
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router, firestore]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
