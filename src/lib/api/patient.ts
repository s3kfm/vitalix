import { NextResponse } from 'next/server';
import { getPatient } from '@/src/db/patient';

/**
 * Looks up the logged-in user's patient for a `/api/patients/[patientId]/...` route.
 * `params` comes back awaited, so routes with an `[id]` segment don't await it again.
 *
 *   const found = await requirePatient(params);
 *   if (!found.ok) return found.response;
 *   const { patient } = found;
 */
export async function requirePatient<P extends { patientId: string }>(params: Promise<P>) {
  const resolved = await params;
  const patient = await getPatient(resolved.patientId);
  if (!patient) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Patient not found.' }, { status: 404 }),
    };
  }
  return { ok: true as const, patient, params: resolved };
}
