import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/src/db';
import { symptoms } from '@/src/db/symptoms';
import { medications, medicationDoses } from '@/src/db/medications';
import { measurements, measurementValues, measurementDefinitions, measurementGroups } from '@/src/db/measurements';
import { getPatient } from '@/src/db/patient';
import type { SymptomRecord, DoseRecord, ApiMeasurement, MedicationRecord } from '@/src/db/types';

export type TimelineItemKind = 'symptom' | 'dose' | 'measurement' | 'medication';

export interface TimelineItem {
  id: string;
  kind: TimelineItemKind;
  timestamp: string;
  createdAt: string;
  title: string;
  detail: string;
  payload: SymptomRecord | DoseRecord | ApiMeasurement | MedicationRecord;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const patient = await getPatient((await params).patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });

    // 1. Symptoms
    const symptomRows = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.patientId, patient.id))
      .orderBy(desc(symptoms.onsetAt), desc(symptoms.id));

    const symptomItems: TimelineItem[] = symptomRows.map((s) => ({
      id: s.id,
      kind: 'symptom' as const,
      timestamp: s.onsetAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      title: s.code.text ?? 'Symptom',
      detail: [
        s.severity !== null ? `${s.severity}/10 severity` : '',
        s.resolvedAt ? 'Resolved' : 'Ongoing',
        s.notes,
      ].filter(Boolean).join(' · '),
      payload: s as unknown as SymptomRecord,
    }));

    // 2. Doses
    const doseRows = await db
      .select()
      .from(medicationDoses)
      .where(eq(medicationDoses.patientId, patient.id))
      .orderBy(desc(medicationDoses.takenAt), desc(medicationDoses.id));

    const doseItems: TimelineItem[] = doseRows.map((d) => ({
      id: d.id,
      kind: 'dose' as const,
      timestamp: d.takenAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      title: d.name,
      detail: [d.dose, d.status, d.notes].filter(Boolean).join(' · '),
      payload: d as unknown as DoseRecord,
    }));

    // 3. Measurements (with values + definition name)
    const measurementRows = await db
      .select()
      .from(measurements)
      .where(eq(measurements.patientId, patient.id))
      .orderBy(desc(measurements.observedAt), desc(measurements.id));

    const measurementItems: TimelineItem[] = await Promise.all(
      measurementRows.map(async (m) => {
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

        const displayValue = vals
          .map((v) => {
            const r = v.result;
            if (r.type === 'quantity' && r.value && typeof r.value === 'object') {
              const value = r.value;
              return `${'value' in value ? value.value : ''} ${'unit' in value ? value.unit : ''}`.trim();
            }
            if (r.type === 'string' && typeof r.value === 'string') return r.value;
            return '';
          })
          .filter(Boolean)
          .join(' / ');

        const payload = {
          ...m,
          definitionName: def[0]?.name ?? null,
          definitionSlug: def[0]?.slug ?? null,
          groupSource: group[0]?.source ?? null,
          values: vals,
        } as unknown as ApiMeasurement;

        return {
          id: m.id,
          kind: 'measurement' as const,
          timestamp: m.observedAt.toISOString(),
          createdAt: m.createdAt.toISOString(),
          title: def[0]?.name ?? 'Measurement',
          detail: [
            displayValue,
            m.status !== 'final' ? m.status : '',
            group[0]?.source ? `via ${group[0].source}` : '',
            m.notes,
          ].filter(Boolean).join(' · '),
          payload,
        };
      })
    );

    // 4. Medications (creation events)
    const medicationRows = await db
      .select()
      .from(medications)
      .where(eq(medications.patientId, patient.id))
      .orderBy(desc(medications.createdAt), desc(medications.id));

    const medicationItems: TimelineItem[] = medicationRows.map((med) => ({
      id: med.id,
      kind: 'medication' as const,
      timestamp: med.createdAt.toISOString(),
      createdAt: med.createdAt.toISOString(),
      title: med.name,
      detail: [
        med.strength || '',
        med.dose,
        med.schedule.length ? `Schedule: ${med.schedule.join(', ')}` : 'As needed',
        med.active ? 'Active' : 'Inactive',
        med.notes,
      ].filter(Boolean).join(' · '),
      payload: med as unknown as MedicationRecord,
    }));

    // Merge & sort chronologically descending
    const allItems = [
      ...symptomItems,
      ...doseItems,
      ...measurementItems,
      ...medicationItems,
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allItems);
  } catch (error) {
    console.error('GET /api/patients/[patientId]/timeline:', error);
    return NextResponse.json(
      { error: 'Could not load timeline.' },
      { status: 500 }
    );
  }
}