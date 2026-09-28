import { NextRequest, NextResponse } from 'next/server';
import { getPatient } from '@/src/db/patient';
import { setupCycleTracking } from '@/src/lib/cycles/service';
import { cycleSetupSchema } from '@/src/lib/validations/cycles';
import { cycleApiError } from '@/src/lib/cycles/http';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  try {
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    await setupCycleTracking(patient.id, cycleSetupSchema.parse(await request.json()));
    return NextResponse.json({ saved: true });
  } catch (error) {
    return cycleApiError(error);
  }
}
