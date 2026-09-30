import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/src/lib/api/patient';
import { getCurrentCycleState } from '@/src/lib/cycles/service';
import { cycleApiError } from '@/src/lib/cycles/http';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    return NextResponse.json(await getCurrentCycleState(patient.id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return cycleApiError(error);
  }
}
