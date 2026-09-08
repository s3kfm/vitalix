import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db';
import { measurementGroups, measurements, measurementValues, measurementDefinitions } from '@/src/db/measurements';
import { findOrCreatePatient } from '@/src/db/patient';
import { createMeasurementGroupSchema } from '@/src/lib/validations/measurements';
import { seedDefinitions } from '@/src/db/seed';
import type { MeasurementResult } from '@/src/lib/measurements/result';

/**
 * POST /api/measurements/group
 * Submit a MeasurementGroup containing 1+ observations.
 * Shared metadata (source, notes, messages) applies to all observations.
 * Each observation becomes its own measurement row inside the group.
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure definitions are seeded
    await seedDefinitions();

    // TODO: Replace with real auth once Clerk/session is wired.
    const authUserId = request.headers.get('x-user-id') || 'demo-user';
    const patient = await findOrCreatePatient(authUserId);

    const body = await request.json();
    const data = await createMeasurementGroupSchema.validate(body);

    // Resolve all definition slugs to IDs upfront (fail fast if any unknown)
    const slugToDef = new Map<string, typeof measurementDefinitions.$inferSelect>();
    for (const obs of data.observations) {
      if (slugToDef.has(obs.definitionSlug)) continue;
      const [def] = await db
        .select()
        .from(measurementDefinitions)
        .where(eq(measurementDefinitions.slug, obs.definitionSlug))
        .limit(1);

      if (!def) {
        return NextResponse.json(
          { error: `Unknown measurement definition: "${obs.definitionSlug}"` },
          { status: 400 }
        );
      }
      slugToDef.set(obs.definitionSlug, def);
    }

    // Create the group
    const [group] = await db
      .insert(measurementGroups)
      .values({
        patientId: patient.id,
        source: data.source,
        observedAt: data.observedAt ? new Date(data.observedAt) : undefined,
        notes: data.notes ?? undefined,
        messages: data.messages ?? undefined,
        sourceMessageId: data.sourceMessageId ?? undefined,
        observationCount: data.observations.length,
      })
      .returning();

    if (!group) {
      return NextResponse.json({ error: 'Failed to create measurement group' }, { status: 500 });
    }

    // Create each measurement + its values inside a transaction
    const created: Array<{ measurement: typeof measurements.$inferSelect; values: typeof measurementValues.$inferSelect[] }> = [];

    for (const obs of data.observations) {
      const def = slugToDef.get(obs.definitionSlug)!;

      const [measurement] = await db
        .insert(measurements)
        .values({
          patientId: patient.id,
          groupId: group.id,
          definitionId: def.id,
          observedAt: new Date(obs.observedAt),
          notes: obs.notes ?? undefined,
          method: obs.method ?? undefined,
          bodySite: obs.bodySite ?? undefined,
        })
        .returning();

      if (!measurement) continue;

      const vals = await db
        .insert(measurementValues)
        .values(
          obs.values.map((v) => ({
            measurementId: measurement.id,
            componentKey: v.componentKey,
            result: v.result as MeasurementResult,
            interpretation: v.interpretation ?? null,
            referenceRanges: v.referenceRanges ?? null,
          }))
        )
        .returning();

      created.push({ measurement, values: vals });
    }

    return NextResponse.json(
      {
        group,
        measurements: created.map((c) => ({
          ...c.measurement,
          definitionSlug: data.observations.find((o) => {
            const def = slugToDef.get(o.definitionSlug);
            return def?.id === c.measurement.definitionId;
          })?.definitionSlug,
          values: c.values,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/measurements/group error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}