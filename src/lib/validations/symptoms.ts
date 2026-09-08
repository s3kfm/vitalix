import * as yup from 'yup';

const timestamp = () => yup.string().required('Enter a date and time.').test(
  'timestamp', 'Enter a valid date and time with a timezone.',
  value => value == null || /T.*(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)),
).test('past', 'Date and time cannot be in the future.', value => value == null || Date.parse(value) <= Date.now());

export const createSymptomSchema = yup.object({
  name: yup.string().trim().max(200).required('Enter a symptom.'),
  onsetAt: timestamp(),
  resolvedAt: timestamp().nullable().optional(),
  severity: yup.number().integer().min(1).max(10).nullable().optional(),
  location: yup.string().trim().max(200).optional(),
  notes: yup.string().trim().max(5000).optional(),
}).test('resolution-order', 'End time must be at or after the start time.', value =>
  !value.resolvedAt || Date.parse(value.resolvedAt) >= Date.parse(value.onsetAt),
);
export type CreateSymptomInput = yup.InferType<typeof createSymptomSchema>;
