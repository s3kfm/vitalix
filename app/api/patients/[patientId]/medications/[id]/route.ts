import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { boolean, object, string, ValidationError } from 'yup';
import { db } from '@/src/db';
import { medications } from '@/src/db/medications';
import { getPatient } from '@/src/db/patient';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ patientId: string; id: string }> }) {
  try {
    const id = await string().uuid().required().validate((await params).id);
    const { active } = await object({ active: boolean().required() }).validate(await request.json(), { strict: true });
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    const [record] = await db.update(medications).set({ active, updatedAt: new Date() })
      .where(and(eq(medications.id, id), eq(medications.patientId, patient.id))).returning();
    if (!record) return NextResponse.json({ error: 'Medication not found.' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('PATCH /api/patients/[patientId]/medications/[id]:', error);
    return NextResponse.json({ error: 'Could not update medication.' }, { status: 500 });
  }
}
