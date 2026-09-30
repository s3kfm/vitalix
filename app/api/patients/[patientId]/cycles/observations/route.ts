import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/src/lib/api/patient';
import { createCycleObservationSchema } from '@/src/lib/validations/cycles';
import { createCycleObservation, listCycleObservations } from '@/src/lib/cycles/service';
import { cycleApiError } from '@/src/lib/cycles/http';
type Context = { params: Promise<{ patientId: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    return NextResponse.json(await listCycleObservations(patient.id));
  } catch (error) {
    return cycleApiError(error);
  }
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const input = createCycleObservationSchema.parse(await request.json());
    return NextResponse.json(await createCycleObservation(patient.id, input), { status: 201 });
  } catch (error) {
    return cycleApiError(error);
  }
}
