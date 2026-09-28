export const patientModuleIds = ['timeline', 'measurements', 'symptoms', 'medications', 'ovulation'] as const;
export type PatientModule = typeof patientModuleIds[number];
export const patientModules: { id: PatientModule; label: string; description?: string }[] = [
  { id: 'timeline', label: 'Timeline', description: 'Always enabled' },
  { id: 'measurements', label: 'Measurements & Labs' },
  { id: 'symptoms', label: 'Symptoms' },
  { id: 'medications', label: 'Medications', description: 'Includes dose tracking' },
  { id: 'ovulation', label: 'Cycle & ovulation', description: 'Period and ovulation tracking' },
];
export const defaultPatientModules: PatientModule[] = ['timeline', 'measurements', 'symptoms', 'medications'];
export interface PatientDetails {
  name: string;
  knownAllergies: string;
  dateOfBirth: string | null;
  enabledModules: PatientModule[];
}
export interface Patient extends PatientDetails { id: string }
