import type { MedicationRecord, DoseRecord } from './db/types';

export type Medicine = Pick<MedicationRecord, 'id' | 'name' | 'strength' | 'dose' | 'schedule' | 'notes' | 'active' | 'startDate' | 'endDate' | 'endedReason' | 'createdAt' | 'updatedAt'>;
export type DoseLog = DoseRecord;
export interface Measurement {
  id: string;
  name: string;
  value: string;
  unit: string;
  recordedAt: string;
  pinned: boolean;
  notes: string;
}
export interface SymptomEntry {
  id: string;
  name: string;
  recordedAt: string;
  severity: number | null;
  location: string;
  notes: string;
  ongoing: boolean;
}
export interface Report {
  id: string;
  name: string;
  recordedAt: string;
  file: File;
}
export interface LabResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  range: string;
  recordedAt: string;
}
export interface ActivityEntry {
  id: string;
  category: 'Measurements' | 'Symptoms' | 'Medications' | 'Reports';
  title: string;
  detail: string;
  recordedAt: string;
}

export type DoseStatus = DoseRecord['status'];
export type NewMedicine = Omit<Medicine, 'id'>;
export type NewMeasurement = Omit<Measurement, 'id'>;
export type NewSymptomEntry = Omit<SymptomEntry, 'id'>;
export type NewDoseLog = Omit<DoseLog, 'id'>;
export type NewReport = Omit<Report, 'id'>;
export type ActivityCategory = ActivityEntry['category'];

export interface UserProfile {
  displayName: string;
  firstName: string;
  initials: string;
}

export interface HealthRecordsContextValue {
  medicines: Medicine[];
  measurements: Measurement[];
  symptoms: SymptomEntry[];
  doses: DoseLog[];
  reports: Report[];
  activity: ActivityEntry[];
  labs: LabResult[];
  addMedicine: (medicine: NewMedicine) => void;
  toggleMedicine: (id: Medicine['id']) => void;
  addMeasurement: (measurement: NewMeasurement) => void;
  togglePin: (name: Measurement['name']) => void;
  addSymptom: (symptom: NewSymptomEntry) => void;
  resolveSymptom: (id: SymptomEntry['id']) => void;
  logDose: (dose: NewDoseLog) => void;
  addReport: (report: NewReport) => void;
}
