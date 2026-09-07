'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { initialMedicines, initialMeasurements, initialSymptoms, initialLabs } from '../data/initialData';
import type { Medicine, Measurement, SymptomEntry, DoseLog, Report, ActivityEntry, HealthRecordsContextValue } from '../types';
function useRecordsState(): HealthRecordsContextValue {
  const [medicines, setMedicines] = useState(initialMedicines);
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([
    ...initialMeasurements.map(m => ({ id: m.id, category: 'Measurements' as const, title: m.name, detail: `${m.value} ${m.unit} · Entered manually`, recordedAt: m.recordedAt })),
    ...initialSymptoms.map(s => ({ id: s.id, category: 'Symptoms' as const, title: s.name, detail: `${s.severity}/10 · ${s.notes}`, recordedAt: s.recordedAt })),
  ]);
  const addActivity = (entry: Omit<ActivityEntry, 'id'>) => setActivity(a => [{ ...entry, id: crypto.randomUUID() }, ...a]);
  return {
    medicines, measurements, symptoms, doses, reports, activity, labs: initialLabs,
    addMedicine: (m: Omit<Medicine, 'id'>) => setMedicines(a => [...a, { ...m, id: crypto.randomUUID() }]),
    toggleMedicine: (id: string) => setMedicines(a => a.map(m => m.id === id ? { ...m, active: !m.active } : m)),
    addMeasurement: (m: Omit<Measurement, 'id'>) => {
      setMeasurements(a => [{ ...m, id: crypto.randomUUID() }, ...a]);
      addActivity({ category: 'Measurements', title: m.name, detail: `${m.value} ${m.unit} · Entered manually`, recordedAt: m.recordedAt });
    },
    togglePin: (name: string) => setMeasurements(a => a.map(m => m.name === name ? { ...m, pinned: !m.pinned } : m)),
    addSymptom: (s: Omit<SymptomEntry, 'id'>) => {
      setSymptoms(a => [{ ...s, id: crypto.randomUUID() }, ...a]);
      addActivity({ category: 'Symptoms', title: s.name, detail: [s.severity !== null ? `${s.severity}/10` : null, s.notes].filter(Boolean).join(' · '), recordedAt: s.recordedAt });
    },
    resolveSymptom: (id: string) => setSymptoms(a => a.map(s => s.id === id ? { ...s, ongoing: false } : s)),
    logDose: (d: Omit<DoseLog, 'id'>) => {
      setDoses(a => [{ ...d, id: crypto.randomUUID() }, ...a]);
      addActivity({ category: 'Medications', title: `${d.name} · ${d.status.toLowerCase()}`, detail: d.dose, recordedAt: d.takenAt });
    },
    addReport: (r: Omit<Report, 'id'>) => {
      setReports(a => [{ ...r, id: crypto.randomUUID() }, ...a]);
      addActivity({ category: 'Reports', title: r.name, detail: 'Added manually · Not extracted', recordedAt: r.recordedAt });
    },
  };
}
const Context = createContext<HealthRecordsContextValue | null>(null);
export function HealthRecordsProvider({ children }: { children: ReactNode }) {
  const value = useRecordsState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useHealthRecords(): HealthRecordsContextValue {
  const value = useContext(Context);
  if (!value) throw new Error('HealthRecordsProvider is required');
  return value;
}
