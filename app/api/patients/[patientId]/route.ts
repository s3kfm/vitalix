import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db';
import { patients } from '@/src/db/measurements';
import { currentUser } from '@/src/lib/auth/session';
import { patientDetailsSchema } from '@/src/lib/validations/patients';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    const { patientId } = await params;
    if (!z.uuid().safeParse(patientId).success) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    const input = await request.json();
    const data = patientDetailsSchema.partial().parse(input);
    // Creation defaults must not overwrite omitted fields on an update.
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      if (!Object.prototype.hasOwnProperty.call(input, key)) delete data[key];
    }
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Provide patient details to update.' }, { status: 400 });
    const [patient] = await db.update(patients).set(data)
      .where(and(eq(patients.id, patientId), eq(patients.ownerUserId, user.id))).returning();
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    return NextResponse.json(patient);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid patient details.' }, { status: 400 });
    }
    console.error('PATCH /api/patients/[patientId]:', error);
    return NextResponse.json({ error: 'Could not update patient.' }, { status: 500 });
  }
}
