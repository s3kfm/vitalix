import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { ValidationError } from 'yup';
import { db } from '@/src/db';
import { medications } from '@/src/db/medications';
import { requirePatient } from '@/src/lib/api/patient';
import { createMedicationSchema } from '@/src/lib/validations/medications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    return NextResponse.json(await db.select().from(medications).where(eq(medications.patientId, patient.id)).orderBy(desc(medications.createdAt), desc(medications.id)));
  } catch (error) {
    console.error('GET /api/patients/[patientId]/medications:', error);
    return NextResponse.json({ error: 'Could not load medications.' }, { status: 500 });
  }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const data = await createMedicationSchema.validate(await request.json(), { stripUnknown: true });
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const [record] = await db.insert(medications).values({ ...data, patientId: patient.id, code: { text: data.name } }).returning();
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('POST /api/patients/[patientId]/medications:', error);
    return NextResponse.json({ error: 'Could not save medications.' }, { status: 500 });
  }
}
