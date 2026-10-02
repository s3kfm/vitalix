import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { string, ValidationError } from 'yup';
import { createMedicationSchema } from '@/src/lib/validations/medications';
import { db } from '@/src/db';
import { medications } from '@/src/db/medications';
import { requirePatient } from '@/src/lib/api/patient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string; id: string }> },
) {
  try {
    const id = await string()
      .uuid()
      .required()
      .validate((await params).id);
    const body = await request.json();
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const [existing] = await db
      .select()
      .from(medications)
      .where(and(eq(medications.id, id), eq(medications.patientId, patient.id)));
    if (!existing) return NextResponse.json({ error: 'Medication not found.' }, { status: 404 });
    const data = await createMedicationSchema.validate(
      { ...existing, ...body },
      { stripUnknown: true },
    );
    const [record] = await db
      .update(medications)
      .set({ ...data, code: { text: data.name }, updatedAt: new Date() })
      .where(and(eq(medications.id, id), eq(medications.patientId, patient.id)))
      .returning();
    if (!record) return NextResponse.json({ error: 'Medication not found.' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('PATCH /api/patients/[patientId]/medications/[id]:', error);
    return NextResponse.json({ error: 'Could not update medication.' }, { status: 500 });
  }
}
