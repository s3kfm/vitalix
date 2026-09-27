import * as yup from 'yup';

const calendarDate = () => yup.string().test('calendar-date', 'Enter a valid calendar date.', v => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v));
const time = () => yup.string().matches(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.').required();
export const createMedicationSchema = yup.object({
  name: yup.string().trim().max(200).required('Enter a medication name.'),
  strength: yup.string().trim().max(200).default(''),
  dose: yup.string().trim().max(200).required('Enter the usual dose.'),
  schedule: yup.array().transform(value => Array.isArray(value) ? [...value].sort() : value).of(time()).max(24).default([]).test('unique', 'Schedule times must be unique.', v => !v || new Set(v).size === v.length),
  notes: yup.string().trim().max(5000).default(''),
  startDate: calendarDate().nullable().default(null),
  endDate: calendarDate().nullable().default(null),
  active: yup.boolean().default(true),
  endedReason: yup.string().oneOf(['Completed', 'Discontinued']).nullable().default(null),
}).test('dates', 'End date must follow start date.', v => !v.startDate || !v.endDate || v.endDate >= v.startDate);
const timestamp = () => yup.string().test('timestamp', 'Enter a valid timestamp with a timezone.', v =>
  v == null || (/T.*(Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v))));
export const createDoseSchema = yup.object({
  medicineId: yup.string().uuid().nullable().default(null),
  name: yup.string().trim().max(200).when('medicineId', { is: (id: unknown) => !id, then: s => s.required('Enter a medication name.') }),
  dose: yup.string().trim().max(200).required('Enter a dose.'),
  status: yup.string().oneOf(['Taken', 'Skipped']).required(),
  takenAt: timestamp().nullable().default(null).when('status', {
    is: 'Taken', then: s => s.required('Enter when you took the dose.').test('past', 'Taken time cannot be in the future.', v => Date.parse(v) <= Date.now()),
    otherwise: s => s.test('skipped', 'Skipped doses cannot have a taken time.', v => v === null),
  }),
  scheduledFor: timestamp().nullable().default(null),
  scheduledTime: time().nullable().default(null),
  timeZone: yup.string().test('timezone', 'Invalid timezone.', v => { try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; } }).default('UTC'),
  notes: yup.string().trim().max(5000).default(''),
}).test('occurrence', 'A scheduled dose requires a medication and scheduled time.', v => !v.scheduledFor || !!(v.medicineId && v.scheduledTime));
export const prescriptionSchema = yup.object({
  prescriber: yup.string().trim().max(200).required(),
  issuedOn: calendarDate().required(),
  validUntil: calendarDate().nullable().default(null),
  reference: yup.string().trim().max(200).default(''),
  active: yup.boolean().default(true),
  items: yup.array().of(yup.object({
    name: yup.string().trim().max(200).required(), dose: yup.string().trim().max(500).required(),
    quantity: yup.string().trim().max(100).default(''), refills: yup.number().integer().min(0).max(999).default(0),
  })).min(1).max(50).required(),
}).test('dates', 'Valid-until date must follow the issue date.', v => !v.validUntil || v.validUntil >= v.issuedOn);
export type CreateMedicationInput = yup.InferType<typeof createMedicationSchema>;
export type CreateDoseInput = yup.InferType<typeof createDoseSchema>;
