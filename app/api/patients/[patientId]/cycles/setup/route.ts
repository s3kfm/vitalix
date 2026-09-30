import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/src/lib/api/patient';
import { setupCycleTracking } from '@/src/lib/cycles/service';
import { cycleSetupSchema } from '@/src/lib/validations/cycles';
import { cycleApiError } from '@/src/lib/cycles/http';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    await setupCycleTracking(patient.id, cycleSetupSchema.parse(await request.json()));
    return NextResponse.json({ saved: true });
  } catch (error) {
    return cycleApiError(error);
  }
}
