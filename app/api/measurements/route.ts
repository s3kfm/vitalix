import type { MeasurementWithValues } from '@/src/db/types';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '@/src/db';
import { measurements, measurementValues, measurementDefinitions, measurementGroups } from '@/src/db/measurements';
import { findOrCreatePatient } from '@/src/db/patient';
import { listMeasurementsSchema } from '@/src/lib/validations/measurements';

/**
 * GET /api/measurements
 * List measurements for the authenticated patient.
 * Query: ?definitionSlug= &from= &to= &limit= &offset=
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with real auth once Clerk/session is wired.
    const authUserId = request.headers.get('x-user-id') || 'demo-user';

    const patient = await findOrCreatePatient(authUserId);

    const { searchParams } = request.nextUrl;
    const raw = {
      definitionSlug: searchParams.get('definitionSlug') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    };

    const query = await listMeasurementsSchema.validate(raw);

    const conditions = [eq(measurements.patientId, patient.id)];

    if (query.definitionSlug) {
      const defs = await db
        .select({ id: measurementDefinitions.id })
        .from(measurementDefinitions)
        .where(eq(measurementDefinitions.slug, query.definitionSlug))
        .limit(1);

      if (defs[0]) {
        conditions.push(eq(measurements.definitionId, defs[0].id));
      }
    }

    if (query.from) {
      conditions.push(gte(measurements.observedAt, new Date(query.from)));
    }
    if (query.to) {
      conditions.push(lte(measurements.observedAt, new Date(query.to)));
    }

    const rows = await db
      .select()
      .from(measurements)
      .where(and(...conditions))
      .orderBy(desc(measurements.observedAt))
      .limit(query.limit!)
      .offset(query.offset!);

    // Attach values + definition name to each measurement
    const result: MeasurementWithValues[] = await Promise.all(
      rows.map(async (m) => {
        const vals = await db
          .select()
          .from(measurementValues)
          .where(eq(measurementValues.measurementId, m.id));

        const def = await db
          .select({ name: measurementDefinitions.name, slug: measurementDefinitions.slug })
          .from(measurementDefinitions)
          .where(eq(measurementDefinitions.id, m.definitionId))
          .limit(1);

        const group = await db
          .select({ source: measurementGroups.source })
          .from(measurementGroups)
          .where(eq(measurementGroups.id, m.groupId))
          .limit(1);

        return {
          ...m,
          definitionName: def[0]?.name ?? null,
          definitionSlug: def[0]?.slug ?? null,
          groupSource: group[0]?.source ?? null,
          values: vals,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/measurements error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}