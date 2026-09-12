import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { ValidationError } from 'yup';
import { db } from '@/src/db';
import { medications, medicationDoses } from '@/src/db/medications';
import { getPatient } from '@/src/db/patient';
import { createDoseSchema } from '@/src/lib/validations/medications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    return NextResponse.json(await db.select().from(medicationDoses).where(eq(medicationDoses.patientId, patient.id)).orderBy(desc(medicationDoses.takenAt), desc(medicationDoses.id)));
  } catch (error) {
    console.error('GET /api/patients/[patientId]/doses:', error);
    return NextResponse.json({ error: 'Could not load doses.' }, { status: 500 });
  }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const data = await createDoseSchema.validate(await request.json(), { stripUnknown: true });
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    const [medicine] = await db.select().from(medications).where(and(eq(medications.id, data.medicineId), eq(medications.patientId, patient.id)));
    if (!medicine) return NextResponse.json({ error: 'Medication not found.' }, { status: 404 });
    if (!medicine.active) return NextResponse.json({ error: 'Restore this medication before logging a dose.' }, { status: 400 });
    if (data.scheduledTime && !medicine.schedule.includes(data.scheduledTime)) return NextResponse.json({ error: 'Invalid scheduled time.' }, { status: 400 });
    const [record] = await db.insert(medicationDoses).values({ ...data, patientId: patient.id, name: medicine.name, takenAt: new Date(data.takenAt) }).returning();
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('POST /api/patients/[patientId]/doses:', error);
    return NextResponse.json({ error: 'Could not save doses.' }, { status: 500 });
  }
}
