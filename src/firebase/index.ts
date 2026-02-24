'use client';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type Storage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { FirebaseProvider, useFirebaseApp, useAuth, useFirestore, useStorage } from './provider';
import FirebaseClientProvider from './client-provider';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: Storage;

// This function is not idempotent, so we need to be careful not to call it multiple times.
// We use getApps().length to check if it has already been called.
function initializeFirebase() {
    if (!getApps().length) {
        if (!firebaseConfig.apiKey) {
            // Return dummy objects to prevent app crash
            return { app: null, auth: null, firestore: null, storage: null };
        }
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        firestore = getFirestore(app);
        storage = getStorage(app);
    }
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
