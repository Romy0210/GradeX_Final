'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase/provider';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'student';
}

export const useUser = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        // If user logs out, clear profile and stop loading
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!firestore || !user) {
      // Don't do anything if we don't have a user or firestore instance
      return;
    }

    // Set up a real-time listener for the user's profile document
    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribeDoc = onSnapshot(userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // If profile doesn't exist, create it.
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || '',
            role: user.email === 'admin@gradex.pro' ? 'admin' : 'student',
          };
          setDoc(userDocRef, newProfile).then(() => {
            setUserProfile(newProfile);
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to user profile:", error);
        setUserProfile(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribeDoc();
  }, [firestore, user]);


  return { user, userProfile, isLoading };
};
