import { z } from 'zod';
import { defaultPatientModules, patientModuleIds } from '../patients';

export const patientDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Enter a patient name.').max(200),
  knownAllergies: z.string().trim().max(5000).default(''),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date of birth.').refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
      && value >= '0001-01-01' && value <= new Date().toISOString().slice(0, 10);
  }, 'Enter a valid date of birth that is not in the future.').nullable().default(null),
  enabledModules: z.array(z.enum(patientModuleIds)).max(patientModuleIds.length)
    .default(defaultPatientModules).transform(values => [...new Set(['timeline' as const, ...values])]),
});
