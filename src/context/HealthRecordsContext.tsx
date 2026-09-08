'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { initialMedicines, initialMeasurements, initialSymptoms, initialLabs } from '../data/initialData';
import type { DoseLog, Report, ActivityEntry, HealthRecordsContextValue } from '../types';

const noop = () => { /* demo — nothing persists */ };

const activity: ActivityEntry[] = [
  ...initialMeasurements.map(m => ({ id: m.id, category: 'Measurements' as const, title: m.name, detail: `${m.value} ${m.unit} · Entered manually`, recordedAt: m.recordedAt })),
  ...initialSymptoms.map(s => ({ id: s.id, category: 'Symptoms' as const, title: s.name, detail: `${s.severity}/10 · ${s.notes}`, recordedAt: s.recordedAt })),
];

const value: HealthRecordsContextValue = {
  medicines: initialMedicines,
  measurements: initialMeasurements,
  symptoms: initialSymptoms,
  doses: [] as DoseLog[],
  reports: [] as Report[],
  activity,
  labs: initialLabs,
  addMedicine: noop,
  toggleMedicine: noop,
  addMeasurement: noop,
  togglePin: noop,
  addSymptom: noop,
  resolveSymptom: noop,
  logDose: noop,
  addReport: noop,
};

const Context = createContext<HealthRecordsContextValue | null>(null);

export function HealthRecordsProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useHealthRecords(): HealthRecordsContextValue {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('HealthRecordsProvider is required');
  return ctx;
}
