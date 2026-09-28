import { NextRequest, NextResponse } from 'next/server';
import { getPatient } from '@/src/db/patient';
import { getCycleOverview } from '@/src/lib/cycles/service';
import { cycleApiError } from '@/src/lib/cycles/http';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  try {
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    return NextResponse.json(await getCycleOverview(patient.id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return cycleApiError(error);
  }
}
