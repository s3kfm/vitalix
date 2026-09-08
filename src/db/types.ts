import type { patients, measurementDefinitions, measurementGroups, measurements, measurementValues, symptoms, medications, medicationDoses } from './schema';

/** JSON transport converts database timestamps to ISO strings, preserving nullability. */
export type Serialized<T> = T extends Date ? string : T extends readonly unknown[]
  ? { [K in keyof T]: Serialized<T[K]> }
  : T extends object ? { [K in keyof T]: Serialized<T[K]> } : T;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type MeasurementDefinition = typeof measurementDefinitions.$inferSelect;
export type NewMeasurementDefinition = typeof measurementDefinitions.$inferInsert;
export type MeasurementGroup = typeof measurementGroups.$inferSelect;
export type NewMeasurementGroup = typeof measurementGroups.$inferInsert;
export type MeasurementRow = typeof measurements.$inferSelect;
export type NewMeasurementRow = typeof measurements.$inferInsert;
export type MeasurementValue = typeof measurementValues.$inferSelect;
export type NewMeasurementValue = typeof measurementValues.$inferInsert;
export type Symptom = typeof symptoms.$inferSelect;
export type NewSymptom = typeof symptoms.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
export type MedicationDose = typeof medicationDoses.$inferSelect;
export type NewMedicationDose = typeof medicationDoses.$inferInsert;

export type MeasurementWithValues = MeasurementRow & {
  definitionName: MeasurementDefinition['name'] | null;
  definitionSlug: MeasurementDefinition['slug'] | null;
  groupSource: MeasurementGroup['source'] | null;
  values: MeasurementValue[];
};
export type ApiMeasurement = Serialized<MeasurementWithValues>;
export type SymptomRecord = Serialized<Symptom>;
export type MedicationRecord = Serialized<Medication>;
export type DoseRecord = Serialized<MedicationDose>;
