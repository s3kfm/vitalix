import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/src/db';
import {
  measurements,
  measurementValues,
  measurementDefinitions,
  measurementGroups,
} from '@/src/db/measurements';
import { requirePatient } from '@/src/lib/api/patient';
import { updateMeasurementSchema } from '@/src/lib/validations/measurements';
import type { MeasurementResult } from '@/src/lib/measurements/result';

/**
 * GET /api/patients/[patientId]/measurements/[id]
 * Fetch a single measurement with its values.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string; id: string }> },
) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const {
      patient,
      params: { id },
    } = found;

    const [measurement] = await db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.patientId, patient.id)))
      .limit(1);

    if (!measurement) {
      return NextResponse.json({ error: 'Measurement not found' }, { status: 404 });
    }

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
    console.error('GET /api/patients/[patientId]/measurements/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/patients/[patientId]/measurements/[id]
 * Amend a measurement (status, notes, observedAt, or replace values).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string; id: string }> },
) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const {
      patient,
      params: { id },
    } = found;

    const [existing] = await db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.patientId, patient.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Measurement not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = await updateMeasurementSchema.validate(body);

    // Update measurement row
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.observedAt) updateData.observedAt = new Date(data.observedAt);
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.bodySite !== undefined) updateData.bodySite = data.bodySite;

    await db.update(measurements).set(updateData).where(eq(measurements.id, id));

    // Replace values if provided
    if (data.values) {
      await db.delete(measurementValues).where(eq(measurementValues.measurementId, id));

      await db.insert(measurementValues).values(
        data.values.map((v) => ({
          measurementId: id,
          componentKey: v.componentKey,
          result: v.result as MeasurementResult,
          interpretation: v.interpretation ?? null,
          referenceRanges: v.referenceRanges ?? null,
        })),
      );
    }

    // Return updated measurement
    const [updated] = await db.select().from(measurements).where(eq(measurements.id, id)).limit(1);

    const values = await db
      .select()
      .from(measurementValues)
      .where(eq(measurementValues.measurementId, id));

    return NextResponse.json({ ...updated, values });
  } catch (error) {
    console.error('PUT /api/patients/[patientId]/measurements/[id] error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/patients/[patientId]/measurements/[id]
 * Soft-delete: sets status to 'entered-in-error'.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string; id: string }> },
) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const {
      patient,
      params: { id },
    } = found;

    const [existing] = await db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.patientId, patient.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Measurement not found' }, { status: 404 });
    }

    await db
      .update(measurements)
      .set({ status: 'entered-in-error', updatedAt: new Date() })
      .where(eq(measurements.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/patients/[patientId]/measurements/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
