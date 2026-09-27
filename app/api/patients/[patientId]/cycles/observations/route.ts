import { NextRequest, NextResponse } from 'next/server';
import { getPatient } from '@/src/db/patient';
import { createCycleObservationSchema } from '@/src/lib/validations/cycles';
import { createCycleObservation, listCycleObservations } from '@/src/lib/cycles/service';
import { cycleApiError } from '@/src/lib/cycles/http';
type Context = { params: Promise<{ patientId: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    return NextResponse.json(await listCycleObservations(patient.id));
  } catch (error) {
    return cycleApiError(error);
  }
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    const input = createCycleObservationSchema.parse(await request.json());
    return NextResponse.json(await createCycleObservation(patient.id, input), { status: 201 });
  } catch (error) {
    return cycleApiError(error);
  }
}
