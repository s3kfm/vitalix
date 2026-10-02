import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db';
import { patients } from '@/src/db/measurements';

import { currentUser } from '@/src/lib/auth/session';

import { patientDetailsSchema } from '@/src/lib/validations/patients';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    return NextResponse.json(
      await db
        .select()
        .from(patients)
        .where(eq(patients.ownerUserId, user.id))
        .orderBy(asc(patients.createdAt), asc(patients.id)),
    );
  } catch (error) {
    console.error('GET /api/patients:', error);
    return NextResponse.json({ error: 'Could not load patients.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    const data = patientDetailsSchema.parse(await request.json());
    const [patient] = await db
      .insert(patients)
      .values({ ...data, ownerUserId: user.id })
      .returning();
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error:
            error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid patient details.',
        },
        { status: 400 },
      );
    }
    console.error('POST /api/patients:', error);
    return NextResponse.json({ error: 'Could not enroll patient.' }, { status: 500 });
  }
}
