import { eq } from 'drizzle-orm';
import { db } from './index';
import { patients } from './measurements';

/**
 * Find an existing patient by authUserId, or create one if not found.
 */
export async function findOrCreatePatient(authUserId: string): Promise<typeof patients.$inferSelect> {
  const existing = await db
    .select()
    .from(patients)
    .where(eq(patients.authUserId, authUserId))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(patients)
    .values({ authUserId })
    .returning();

  return created!;
}