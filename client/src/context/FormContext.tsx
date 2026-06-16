import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ManualInputs } from '../types';

const EMPTY_MANUAL: ManualInputs = {
  facilityNameOverride: '',
  emr: '',
  currentCensus: '',
  patientType: '',
  previousCoverage: '',
  previousProviderPerformance: '',
  medicalCoverage: '',
};

interface FormContextValue {
  activeCcn: string;
  setActiveCcn: (ccn: string) => void;
  manual: ManualInputs;
  setManualField: <K extends keyof ManualInputs>(key: K, value: ManualInputs[K]) => void;
  resetManual: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ children }: { children: ReactNode }) {
  const [activeCcn, setActiveCcn] = useState('');
  const [manual, setManual] = useState<ManualInputs>(EMPTY_MANUAL);

  const value = useMemo<FormContextValue>(
    () => ({
      activeCcn,
      setActiveCcn,
      manual,
      setManualField: (key, val) => setManual((prev) => ({ ...prev, [key]: val })),
      resetManual: () => setManual(EMPTY_MANUAL),
    }),
    [activeCcn, manual],
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useForm(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useForm must be used within FormProvider');
  return ctx;
}
