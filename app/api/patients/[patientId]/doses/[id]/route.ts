import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { string, ValidationError } from 'yup';
import { db } from '@/src/db';
import { medicationDoses } from '@/src/db/medications';
import { requirePatient } from '@/src/lib/api/patient';
import { createDoseSchema } from '@/src/lib/validations/medications';
type Context = { params: Promise<{ patientId: string; id: string }> };
async function change(request: NextRequest, context: Context, remove: boolean) {
  try {
    const { id } = await context.params;
    await string().uuid().required().validate(id);
    const found = await requirePatient(context.params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const where = and(eq(medicationDoses.id, id), eq(medicationDoses.patientId, patient.id));
    const [existing] = await db.select().from(medicationDoses).where(where);
    if (!existing) return NextResponse.json({ error: 'Dose not found.' }, { status: 404 });
    if (remove) { await db.delete(medicationDoses).where(where); return new NextResponse(null, { status: 204 }); }
    const body = await request.json();
    const data = await createDoseSchema.validate({ ...existing, scheduledFor: existing.scheduledFor?.toISOString() ?? null,
      dose: body.dose, notes: body.notes, status: body.status, takenAt: body.takenAt,
    }, { stripUnknown: true });
    const [record] = await db.update(medicationDoses).set({ dose: data.dose, notes: data.notes, status: data.status, takenAt: data.takenAt ? new Date(data.takenAt) : null }).where(where).returning();
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: 'Could not update dose.' }, { status: 500 });
  }
}
export const PATCH = (r: NextRequest, c: Context) => change(r, c, false);
export const DELETE = (r: NextRequest, c: Context) => change(r, c, true);
