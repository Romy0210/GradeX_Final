'use client';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type Storage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { FirebaseProvider, useFirebaseApp, useAuth, useFirestore, useStorage } from './provider';
import FirebaseClientProvider from './client-provider';

function initializeFirebase() {
    if (!firebaseConfig.apiKey) {
        console.error('❌ Firebase config is missing. Check your .env.local file.');
        throw new Error('Firebase config is missing. Ensure NEXT_PUBLIC_FIREBASE_* env vars are set.');
    }

    // ✅ Get existing app or initialize a new one
    const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

    // ✅ Always derive from the app instance
    const auth: Auth = getAuth(app);
    const firestore: Firestore = getFirestore(app);
    const storage: Storage = getStorage(app);

    return { app, auth, firestore, storage };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useStorage,
};