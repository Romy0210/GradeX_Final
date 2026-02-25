'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react";
import { useFirestore } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export interface ModelParameters {
  highRiskThreshold: number;
  lowRiskThreshold: number;
}

interface SettingsContextType {
  modelParameters: ModelParameters;
  setModelParameters: (params: ModelParameters) => void;
}

const defaultModelParameters: ModelParameters = {
  highRiskThreshold: 6.5,
  lowRiskThreshold: 8.0,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const [modelParameters, setModelParametersState] = useState<ModelParameters>(defaultModelParameters);

  // Real-time listener for settings in Firestore
  useEffect(() => {
    if (!firestore) return;

    const docRef = doc(firestore, "settings", "modelParameters");
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.highRiskThreshold !== undefined && data.lowRiskThreshold !== undefined) {
            setModelParametersState(data as ModelParameters);
          }
        } else {
          // If document doesn't exist, create it with defaults
          setDoc(docRef, defaultModelParameters).catch((error) => {
            console.error("Error writing default settings to Firestore:", error);
          });
        }
      },
      (error) => {
        console.error("Error listening to settings:", error);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  const setModelParameters = useCallback(async (params: ModelParameters) => {
    setModelParametersState(params);
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, "settings", "modelParameters"), params);
    } catch (error) {
      console.error("Error writing settings to Firestore:", error);
    }
  }, [firestore]);

  const value = {
    modelParameters,
    setModelParameters,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
