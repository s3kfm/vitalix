import { NextRequest, NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db';
import { patients } from '@/src/db/measurements';

const enrollmentSchema = z.object({ name: z.string().trim().min(1).max(200) });

export async function GET() {
  try {
    return NextResponse.json(await db.select().from(patients).orderBy(asc(patients.createdAt), asc(patients.id)));
  } catch (error) {
    console.error('GET /api/patients:', error);
    return NextResponse.json({ error: 'Could not load patients.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = enrollmentSchema.parse(await request.json());
    const [patient] = await db.insert(patients).values(data).returning();
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Enter a patient name (1–200 characters).' }, { status: 400 });
    }
    console.error('POST /api/patients:', error);
    return NextResponse.json({ error: 'Could not enroll patient.' }, { status: 500 });
  }
}
