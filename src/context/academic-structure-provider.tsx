'use client';

import { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback, 
    ReactNode 
} from "react";
import { initialSubjectConfigurations, type SubjectConfiguration, type Subject } from "@/lib/academic-structure";

const STORAGE_KEY = "gradex-academic-structure";
const DATA_VERSION = 1;

interface AcademicStructureContextType {
  configurations: SubjectConfiguration[];
  getSubjectsForGroup: (batch: string, className: string, semester: string) => Subject[];
  addOrUpdateConfiguration: (config: SubjectConfiguration) => void;
  createAcademicGroup: (group: { batch: string; class: string; semester: string }) => boolean;
}

const AcademicStructureContext = createContext<AcademicStructureContextType | undefined>(undefined);

export function AcademicStructureProvider({ children }: { children: ReactNode }) {
  const [configurations, setConfigurations] = useState<SubjectConfiguration[]>(initialSubjectConfigurations);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
          const storedData = JSON.parse(item);
          if (storedData.version !== DATA_VERSION) {
            const newData = { version: DATA_VERSION, configurations: initialSubjectConfigurations };
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setConfigurations(initialSubjectConfigurations);
          } else {
            setConfigurations(storedData.configurations);
          }
        } else {
          const newData = { version: DATA_VERSION, configurations: initialSubjectConfigurations };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
          setConfigurations(initialSubjectConfigurations);
        }
      } catch (error) {
        console.error("Error handling localStorage for academic structure.", error);
        const newData = { version: DATA_VERSION, configurations: initialSubjectConfigurations };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setConfigurations(initialSubjectConfigurations);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      try {
        const dataToStore = { version: DATA_VERSION, configurations };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      } catch (error) {
        console.error("Error writing academic structure to localStorage", error);
      }
    }
  }, [configurations, isClient]);
  
  const getSubjectsForGroup = useCallback((batch: string, className: string, semester: string): Subject[] => {
    if (!batch || !className || !semester) return [];
    const configId = `${batch}-${className}-${semester}`;
    const config = configurations.find(c => c.id === configId);
    return config ? config.subjects : [];
  }, [configurations]);

  const addOrUpdateConfiguration = useCallback((newConfig: SubjectConfiguration) => {
    setConfigurations(prevConfigs => {
        const existingIndex = prevConfigs.findIndex(c => c.id === newConfig.id);
        if (existingIndex > -1) {
            const updatedConfigs = [...prevConfigs];
            updatedConfigs[existingIndex] = newConfig;
            return updatedConfigs;
        }
        return [...prevConfigs, newConfig];
    });
  }, []);

  const createAcademicGroup = useCallback((group: { batch: string; class: string; semester: string; }): boolean => {
    const { batch, class: className, semester } = group;
    const configId = `${batch}-${className}-${semester}`;

    const exists = configurations.some(c => c.id === configId);
    if (exists) {
        return false; // Indicate failure (group exists)
    }

    const newConfig: SubjectConfiguration = {
        id: configId,
        batch,
        class: className,
        semester,
        subjects: [], // Start with no subjects
    };
    addOrUpdateConfiguration(newConfig);
    return true; // Indicate success
  }, [configurations, addOrUpdateConfiguration]);

  const value = {
    configurations,
    getSubjectsForGroup,
    addOrUpdateConfiguration,
    createAcademicGroup,
  };

  return (
    <AcademicStructureContext.Provider value={value}>
      {children}
    </AcademicStructureContext.Provider>
  );
}

export function useAcademicStructure() {
    const context = useContext(AcademicStructureContext);
    if (context === undefined) {
        throw new Error('useAcademicStructure must be used within an AcademicStructureProvider');
    }
    return context;
}
