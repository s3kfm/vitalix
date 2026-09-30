import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPatient } from '@/src/db/patient';
import { updateCycleObservationSchema } from '@/src/lib/validations/cycles';
import {
  CycleObservationNotFound,
  deleteCycleObservation,
  getCycleObservation,
  updateCycleObservation,
} from '@/src/lib/cycles/service';
import { cycleApiError } from '@/src/lib/cycles/http';
type Context = { params: Promise<{ patientId: string; id: string }> };
// Not requirePatient: a bad patient or id both answer "Observation not found."
async function authorized(context: Context) {
  const { patientId, id } = await context.params;
  const patient = await getPatient(patientId);
  if (!patient || !z.uuid().safeParse(id).success) return null;
  return { patientId: patient.id, id };
}
export async function GET(_request: NextRequest, context: Context) {
  try {
    const scope = await authorized(context);
    if (!scope) return NextResponse.json({ error: 'Observation not found.' }, { status: 404 });
    const row = await getCycleObservation(scope.patientId, scope.id);
    if (!row) throw new CycleObservationNotFound();
    return NextResponse.json(row);
  } catch (error) {
    return cycleApiError(error);
  }
}
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const scope = await authorized(context);
    if (!scope) return NextResponse.json({ error: 'Observation not found.' }, { status: 404 });
    return NextResponse.json(
      await updateCycleObservation(
        scope.patientId,
        scope.id,
        updateCycleObservationSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return cycleApiError(error);
  }
}
export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const scope = await authorized(context);
    if (!scope) return NextResponse.json({ error: 'Observation not found.' }, { status: 404 });
    await deleteCycleObservation(scope.patientId, scope.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return cycleApiError(error);
  }
}
