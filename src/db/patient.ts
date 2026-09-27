import { cache } from 'react';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { currentUser } from '@/src/lib/auth/session';
import { db } from './index';
import { patients } from './measurements';

/** Reads never enroll a patient implicitly. */
export async function getPatient(id: string) {
  const user = await currentUser();
  if (!user) return null;
  if (!z.uuid().safeParse(id).success) return null;
  const [patient] = await db.select().from(patients).where(and(eq(patients.id, id), eq(patients.ownerUserId, user.id))).limit(1);
  return patient ?? null;
}

/** Shared by server layouts; cached only for the current render. */
export const listPatients = cache(async (userId: string) => db.select({
  id: patients.id,
  name: patients.name,
  knownAllergies: patients.knownAllergies,
  dateOfBirth: patients.dateOfBirth,
  enabledModules: patients.enabledModules,
}).from(patients).where(eq(patients.ownerUserId, userId)).orderBy(asc(patients.createdAt), asc(patients.id)));
