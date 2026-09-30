import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { string, ValidationError } from 'yup';
import { db } from '@/src/db';
import { symptoms } from '@/src/db/symptoms';
import { requirePatient } from '@/src/lib/api/patient';

// The only update currently supported is marking an episode resolved now.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ patientId: string; id: string }> }) {
  try {
    const id = await string().uuid().required().validate((await params).id);
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const [record] = await db.update(symptoms).set({
      resolvedAt: sql`coalesce(${symptoms.resolvedAt}, now())`,
      updatedAt: new Date(),
    }).where(and(eq(symptoms.id, id), eq(symptoms.patientId, patient.id))).returning();
    if (!record) return NextResponse.json({ error: 'Symptom not found.' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('PATCH /api/patients/[patientId]/symptoms/[id]:', error);
    return NextResponse.json({ error: 'Could not resolve symptom.' }, { status: 500 });
  }
}
