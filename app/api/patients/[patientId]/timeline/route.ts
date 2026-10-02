import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/src/db';
import { symptoms } from '@/src/db/symptoms';
import { medications, medicationDoses } from '@/src/db/medications';
import { measurements } from '@/src/db/measurements';
import { withMeasurementDetails } from '@/src/db/measurement-details';
import { requirePatient } from '@/src/lib/api/patient';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;

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
      ]
        .filter(Boolean)
        .join(' · '),
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
      timestamp: (d.takenAt ?? d.recordedAt).toISOString(),
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

    const measurementItems: TimelineItem[] = (await withMeasurementDetails(measurementRows)).map(
      (m) => {
        const displayValue = m.values
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

        return {
          id: m.id,
          kind: 'measurement' as const,
          timestamp: m.observedAt.toISOString(),
          createdAt: m.createdAt.toISOString(),
          title: m.definitionName ?? 'Measurement',
          detail: [
            displayValue,
            m.status !== 'final' ? m.status : '',
            m.groupSource ? `via ${m.groupSource}` : '',
            m.notes,
          ]
            .filter(Boolean)
            .join(' · '),
          payload: m as unknown as ApiMeasurement,
        };
      },
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
      ]
        .filter(Boolean)
        .join(' · '),
      payload: med as unknown as MedicationRecord,
    }));

    // Merge & sort chronologically descending
    const allItems = [...symptomItems, ...doseItems, ...measurementItems, ...medicationItems].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json(allItems);
  } catch (error) {
    console.error('GET /api/patients/[patientId]/timeline:', error);
    return NextResponse.json({ error: 'Could not load timeline.' }, { status: 500 });
  }
}
