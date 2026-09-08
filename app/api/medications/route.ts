import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { ValidationError } from 'yup';
import { db } from '@/src/db';
import { medications } from '@/src/db/medications';
import { findOrCreatePatient } from '@/src/db/patient';
import { createMedicationSchema } from '@/src/lib/validations/medications';

export async function GET(request: NextRequest) {
  try {
    const patient = await findOrCreatePatient(request.headers.get('x-user-id') || 'demo-user');
    return NextResponse.json(await db.select().from(medications).where(eq(medications.patientId, patient.id)).orderBy(desc(medications.createdAt), desc(medications.id)));
  } catch (error) {
    console.error('GET /api/medications:', error);
    return NextResponse.json({ error: 'Could not load medications.' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const data = await createMedicationSchema.validate(await request.json(), { stripUnknown: true });
    const patient = await findOrCreatePatient(request.headers.get('x-user-id') || 'demo-user');
    const [record] = await db.insert(medications).values({ ...data, patientId: patient.id, code: { text: data.name } }).returning();
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('POST /api/medications:', error);
    return NextResponse.json({ error: 'Could not save medications.' }, { status: 500 });
  }
}
