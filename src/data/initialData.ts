import type { Medicine, Measurement, SymptomEntry, LabResult, UserProfile } from '../types';
const today = new Date();
today.setHours(8, 0, 0, 0);
const morning = today.toISOString();
export const initialMedicines: Medicine[] = [
  { id: 'med-1', name: 'Metformin', strength: '500 mg', dose: '1 tablet', schedule: ['08:00', '20:00'], notes: 'With meals', active: true },
  { id: 'med-2', name: 'Vitamin D', strength: '1,000 IU', dose: '1 softgel', schedule: ['08:00'], notes: '', active: true },
  { id: 'med-3', name: 'Ibuprofen', strength: '200 mg', dose: '1 tablet', schedule: [], notes: 'As needed', active: true },
];
export const initialMeasurements: Measurement[] = [
  { id: 'm-1', name: 'Blood pressure', value: '120/80', unit: 'mmHg', recordedAt: morning, pinned: true, notes: 'Seated, before breakfast' },
  { id: 'm-2', name: 'Weight', value: '72.5', unit: 'kg', recordedAt: morning, pinned: true, notes: '' },
  { id: 'm-3', name: 'Temperature', value: '36.7', unit: '°C', recordedAt: morning, pinned: false, notes: '' },
  { id: 'm-4', name: 'Resting heart rate', value: '68', unit: 'bpm', recordedAt: morning, pinned: true, notes: '' },
];
export const initialSymptoms: SymptomEntry[] = [
  { id: 's-1', name: 'Headache', recordedAt: morning, severity: 3, location: 'Temples', notes: 'After a long morning at my desk.', ongoing: true },
];
export const initialLabs: LabResult[] = [
  { id: 'l-1', name: 'Vitamin D (25-OH)', value: '32', unit: 'ng/mL', range: '30–100', recordedAt: morning },
  { id: 'l-2', name: 'Hemoglobin', value: '13.5', unit: 'g/dL', range: '12–16', recordedAt: morning },
];

export const demoProfile: UserProfile = {
  displayName: 'Jane Doe',
  firstName: 'Jane',
  initials: 'JD',
};
