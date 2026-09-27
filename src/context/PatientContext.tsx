'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Patient, PatientDetails } from '@/src/lib/patients';
export type { Patient } from '@/src/lib/patients';
interface PatientContextValue {
  patients: Patient[];
  patient: Patient | null;
  loading: boolean;
  error: string | null;
  selectPatient: (id: string) => void;
  enrollPatient: (details: PatientDetails) => Promise<void>;
  updatePatient: (id: string, details: PatientDetails) => Promise<void>;
  reload: () => void;
  patientUrl: (path: string) => string;
}
const Context = createContext<PatientContextValue | null>(null);

export function PatientProvider({ children, initialPatients }: { children: ReactNode; initialPatients: Patient[] }) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [patientId, setPatientId] = useState<string | null>(initialPatients[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (revision === 0) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/patients', { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load patients.');
        const list: Patient[] = await response.json();
        if (controller.signal.aborted) return;
        setPatients(list);
        setPatientId(current => list.some(p => p.id === current) ? current : list[0]?.id ?? null);
      } catch {
        if (!controller.signal.aborted) setError('Could not load patients.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [revision]);
  const patient = patients.find(p => p.id === patientId) ?? null;
  async function enrollPatient(details: PatientDetails) {
    const response = await fetch('/api/patients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Could not enroll patient.');
    const created: Patient = body;
    setPatients(current => [...current, created]);
    setPatientId(created.id);
  }
  async function updatePatient(id: string, details: PatientDetails) {
    const response = await fetch(`/api/patients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Could not update patient.');
    setPatients(current => current.map(item => item.id === id ? body as Patient : item));
  }
  return <Context.Provider value={{ patients, patient, loading, error,
    selectPatient: setPatientId, enrollPatient, updatePatient, reload: () => setRevision(n => n + 1),
    patientUrl: path => {
      if (!patient) throw new Error('Select a patient first.');
      return `/api/patients/${patient.id}${path}`;
    },
  }}>{children}</Context.Provider>;
}

export function usePatient() {
  const context = useContext(Context);
  if (!context) throw new Error('PatientProvider is required.');
  return context;
}
