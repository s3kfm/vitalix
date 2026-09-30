import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { ValidationError } from 'yup';
import { db } from '@/src/db';
import { medications, medicationDoses } from '@/src/db/medications';
import { requirePatient } from '@/src/lib/api/patient';
import { period } from '@/src/lib/medications/schedule';
import { createDoseSchema } from '@/src/lib/validations/medications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    return NextResponse.json(await db.select().from(medicationDoses).where(eq(medicationDoses.patientId, patient.id)).orderBy(desc(medicationDoses.recordedAt), desc(medicationDoses.id)));
  } catch (error) {
    console.error('GET /api/patients/[patientId]/doses:', error);
    return NextResponse.json({ error: 'Could not load doses.' }, { status: 500 });
  }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const data = await createDoseSchema.validate(await request.json(), { stripUnknown: true });
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const { timeZone, ...values } = data;
    let name = data.name!;
    if (data.medicineId) {
      const [medicine] = await db.select().from(medications).where(and(eq(medications.id, data.medicineId), eq(medications.patientId, patient.id)));
      if (!medicine) return NextResponse.json({ error: 'Medication not found.' }, { status: 404 });
      name = `${medicine.name} ${medicine.strength}`.trim();
      if (data.scheduledFor) {
        const when = new Date(data.scheduledFor);
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(when);
        const part = (type: string) => parts.find(p => p.type === type)!.value;
        const day = `${part('year')}-${part('month')}-${part('day')}`;
        const nowParts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        const nowPart = (type: string) => nowParts.find(p => p.type === type)!.value;
        const scheduledDay = Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')));
        const currentDay = Date.UTC(Number(nowPart('year')), Number(nowPart('month')) - 1, Number(nowPart('day')));
        if (scheduledDay > currentDay || (scheduledDay === currentDay && period(Number(part('hour'))) > period(Number(nowPart('hour')))))
          return NextResponse.json({ error: 'This dose is in an upcoming period.' }, { status: 400 });
        const localTime = `${part('hour')}:${part('minute')}`;
        if (!medicine.schedule.includes(localTime) || localTime !== data.scheduledTime || when.getUTCSeconds() || when.getUTCMilliseconds() || (medicine.startDate ? day < medicine.startDate : when < medicine.createdAt) || (medicine.endDate && day > medicine.endDate) || (!medicine.active && when > medicine.updatedAt))
          return NextResponse.json({ error: 'Invalid scheduled occurrence.' }, { status: 400 });
      } else if (medicine.schedule.length || !medicine.active || (medicine.endDate && medicine.endDate < new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())) || (medicine.startDate && medicine.startDate > new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date()))) {
        return NextResponse.json({ error: 'Choose a scheduled occurrence for this medication.' }, { status: 400 });
      }
    } else if (data.scheduledFor || data.scheduledTime) {
      return NextResponse.json({ error: 'One-off doses cannot have a schedule.' }, { status: 400 });
    }
    const [record] = await db.insert(medicationDoses).values({ ...values, patientId: patient.id, name,
      takenAt: data.takenAt ? new Date(data.takenAt) : null,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
    }).onConflictDoNothing().returning();
    if (!record) return NextResponse.json({ error: 'This occurrence was already recorded. Refresh your routine.' }, { status: 409 });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('POST /api/patients/[patientId]/doses:', error);
    return NextResponse.json({ error: 'Could not save doses.' }, { status: 500 });
  }
}
