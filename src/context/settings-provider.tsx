'use client';

import { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback, 
    ReactNode 
} from "react";

const STORAGE_KEY = "gradex-settings";

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
  const [modelParameters, setModelParametersState] = useState<ModelParameters>(defaultModelParameters);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
            const storedParams = JSON.parse(item);
            // A simple validation to ensure the loaded settings have the correct shape
            if (storedParams.highRiskThreshold !== undefined && storedParams.lowRiskThreshold !== undefined) {
               setModelParametersState(storedParams);
            } else {
               window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultModelParameters));
            }
        } else {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultModelParameters));
        }
      } catch (error) {
        console.error("Error reading settings from localStorage.", error);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultModelParameters));
      }
    }
  }, [isClient]);

  const setModelParameters = useCallback((params: ModelParameters) => {
    setModelParametersState(params);
    if (isClient) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      } catch (error) {
        console.error("Error writing settings to localStorage", error);
      }
    }
  }, [isClient]);
  
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
