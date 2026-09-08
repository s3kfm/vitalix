import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc, ne } from 'drizzle-orm';
import { db } from '@/src/db';
import { measurements, measurementValues, measurementDefinitions, measurementGroups } from '@/src/db/measurements';
import { findOrCreatePatient } from '@/src/db/patient';

/**
 * GET /api/measurements/latest
 * Fetch the latest (most recently observed) measurement for the patient.
 * Query: ?definitionSlug= (optional — if provided, returns the latest for that definition)
 */
export async function GET(request: NextRequest) {
  try {
    const authUserId = request.headers.get('x-user-id') || 'demo-user';
    const patient = await findOrCreatePatient(authUserId);

    const { searchParams } = request.nextUrl;
    const definitionSlug = searchParams.get('definitionSlug') || undefined;

    const conditions = [
      eq(measurements.patientId, patient.id),
      ne(measurements.status, 'entered-in-error'),
    ];

    // If a specific definition slug is requested, resolve it first
    if (definitionSlug) {
      const [def] = await db
        .select({ id: measurementDefinitions.id })
        .from(measurementDefinitions)
        .where(eq(measurementDefinitions.slug, definitionSlug))
        .limit(1);

      if (!def) {
        return NextResponse.json(
          { error: `Unknown measurement definition: "${definitionSlug}"` },
          { status: 400 }
        );
      }

      conditions.push(eq(measurements.definitionId, def.id));
    }

    const [measurement] = await db
      .select()
      .from(measurements)
      .where(and(...conditions))
      .orderBy(desc(measurements.observedAt))
      .limit(1);

    if (!measurement) {
      return NextResponse.json(null);
    }

    // Attach values, definition, and group source
    const values = await db
      .select()
      .from(measurementValues)
      .where(eq(measurementValues.measurementId, measurement.id));

    const [def] = await db
      .select({ name: measurementDefinitions.name, slug: measurementDefinitions.slug })
      .from(measurementDefinitions)
      .where(eq(measurementDefinitions.id, measurement.definitionId))
      .limit(1);

    const [group] = await db
      .select({ source: measurementGroups.source })
      .from(measurementGroups)
      .where(eq(measurementGroups.id, measurement.groupId))
      .limit(1);

    return NextResponse.json({
      ...measurement,
      definitionName: def?.name ?? null,
      definitionSlug: def?.slug ?? null,
      groupSource: group?.source ?? null,
      values,
    });
  } catch (error) {
    console.error('GET /api/measurements/latest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}