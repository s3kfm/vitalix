import * as yup from 'yup';

const time = () => yup.string().matches(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.').required();
export const createMedicationSchema = yup.object({
  name: yup.string().trim().max(200).required('Enter a medication name.'),
  strength: yup.string().trim().max(200).default(''),
  dose: yup.string().trim().max(200).required('Enter the usual dose.'),
  schedule: yup.array().transform(value => Array.isArray(value) ? [...value].sort() : value).of(time()).max(24).default([]).test('unique', 'Schedule times must be unique.', v => !v || new Set(v).size === v.length),
  notes: yup.string().trim().max(5000).default(''),
});
export const createDoseSchema = yup.object({
  medicineId: yup.string().uuid().required(),
  dose: yup.string().trim().max(200).required('Enter a dose.'),
  status: yup.string().oneOf(['Taken', 'Skipped']).required(),
  takenAt: yup.string().required().test('timestamp', 'Enter a valid date and time in the past.', v =>
    !!v && /T.*(Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v)) && Date.parse(v) <= Date.now()),
  scheduledTime: time().optional(),
  notes: yup.string().trim().max(5000).default(''),
});
export type CreateMedicationInput = yup.InferType<typeof createMedicationSchema>;
export type CreateDoseInput = yup.InferType<typeof createDoseSchema>;
