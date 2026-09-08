import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { ValidationError } from 'yup';
import { db } from '@/src/db';
import { symptoms } from '@/src/db/symptoms';
import { findOrCreatePatient } from '@/src/db/patient';
import { createSymptomSchema } from '@/src/lib/validations/symptoms';

export async function GET(request: NextRequest) {
  try {
    // Same demo identity as measurements until session authentication is wired.
    const patient = await findOrCreatePatient(request.headers.get('x-user-id') || 'demo-user');
    const rows = await db.select().from(symptoms).where(eq(symptoms.patientId, patient.id))
      .orderBy(desc(symptoms.onsetAt), desc(symptoms.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/symptoms:', error);
    return NextResponse.json({ error: 'Could not load symptoms.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await createSymptomSchema.validate(await request.json(), { stripUnknown: true });
    const patient = await findOrCreatePatient(request.headers.get('x-user-id') || 'demo-user');
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
    console.error('POST /api/symptoms:', error);
    return NextResponse.json({ error: 'Could not save symptom.' }, { status: 500 });
  }
}
