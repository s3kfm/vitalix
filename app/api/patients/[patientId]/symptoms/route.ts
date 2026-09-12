import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { ValidationError } from 'yup';
import { db } from '@/src/db';
import { symptoms } from '@/src/db/symptoms';
import { getPatient } from '@/src/db/patient';
import { createSymptomSchema } from '@/src/lib/validations/symptoms';

export async function GET(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    // Same demo identity as measurements until session authentication is wired.
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    const rows = await db.select().from(symptoms).where(eq(symptoms.patientId, patient.id))
      .orderBy(desc(symptoms.onsetAt), desc(symptoms.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/patients/[patientId]/symptoms:', error);
    return NextResponse.json({ error: 'Could not load symptoms.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const data = await createSymptomSchema.validate(await request.json(), { stripUnknown: true });
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    const [record] = await db.insert(symptoms).values({
      patientId: patient.id,
      code: { text: data.name },
      onsetAt: new Date(data.onsetAt),
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
      severity: data.severity ?? null,
      bodySite: data.location ? { text: data.location } : null,
      notes: data.notes || null,
    }).returning();
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('POST /api/patients/[patientId]/symptoms:', error);
    return NextResponse.json({ error: 'Could not save symptom.' }, { status: 500 });
  }
}
