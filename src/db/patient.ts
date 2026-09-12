import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from './index';
import { patients } from './measurements';

/** Reads never enroll a patient implicitly. */
export async function getPatient(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [patient] = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return patient ?? null;
}
