'use client';
import { usePatient } from '@/src/context/PatientContext';
import { useState } from 'react';
import { Pin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useHealthRecords } from '../../context/HealthRecordsContext';
import type { MeasurementDefinition as Definition, ApiMeasurement } from '../../db/types';
import { displayMeasurement as displayValue } from '../../lib/measurements/display';
import { formatDate } from '../ui/format';
import { Modal } from 'rsuite';
import { EmptyState } from '../ui/EmptyState';

export function MeasurementTable({ query }: { query: string }) {
  const { patientUrl } = usePatient();
  const { togglePin } = useHealthRecords();
  const [selected, setSelected] = useState<string | null>(null);

  // Fetch all definitions
  const definitions = useQuery<Definition[]>({
    queryKey: ['measurements', 'definitions'],
  });

  // Fetch latest measurement for each definition in parallel
  const latestQueries = useQuery<(ApiMeasurement | null)[]>({
    queryKey: ['measurements', 'latest', 'by-definition'],
    enabled: !!definitions.data?.length,
    queryFn: async () => {
      const slugs = definitions.data!.map((d) => d.slug);
      const results = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const res = await fetch(
              patientUrl(`/measurements/latest?definitionSlug=${encodeURIComponent(slug)}`),
            );
            if (!res.ok) return null;
            return (await res.json()) as ApiMeasurement | null;
          } catch {
            return null;
          }
        }),
      );
      return results;
    },
  });

  const isLoading = definitions.isPending || (definitions.isSuccess && latestQueries.isPending);
  const isError = definitions.isError || latestQueries.isError;

  // Build the list: definition name + latest measurement (if exists)
  const rows = (latestQueries.data ?? [])
    .map((m) => {
      if (!m) return null;
      const disp = displayValue(m);
      return {
        id: m.id,
        name: m.definitionName ?? m.definitionSlug ?? 'Unknown measurement',
        slug: m.definitionSlug,
        value: disp.value,
        unit: disp.unit,
        recordedAt: m.observedAt,
        source: m.groupSource ?? 'manual',
        notes: m.notes,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  const selectedMeasurements =
    latestQueries.data
      ?.filter((m): m is ApiMeasurement => m !== null && m.definitionSlug === selected)
      .flatMap((m) => [m]) ?? [];

  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Measurement</th>
              <th>Latest reading</th>
              <th>Recorded</th>
              <th>Source</th>
              <th>Pin</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !rows.length && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading measurements…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  Could not load measurements.
                </td>
              </tr>
            )}
            {rows.map((m) => (
              <tr key={m.id}>
                <td>
                  <button className="text-button" onClick={() => setSelected(m.slug)}>
                    {m.name}
                  </button>
                </td>
                <td>
                  <strong className="reading">{m.value}</strong>{' '}
                  <span className="muted">{m.unit}</span>
                </td>
                <td>{formatDate(m.recordedAt)}</td>
                <td>
                  <span className="badge neutral">{m.source === 'ai' ? 'AI' : 'Manual entry'}</span>
                </td>
                <td>
                  <button
                    className="pin-button"
                    aria-label={`Pin ${m.name}`}
                    aria-pressed={false}
                    onClick={() => togglePin(m.name)}
                  >
                    <Pin size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && !isError && !rows.length && (
        <EmptyState
          title="No measurements found"
          description="Add any measurement you'd like to keep track of."
        />
      )}
      <Modal open={selected !== null} onClose={() => setSelected(null)} size="sm">
        <Modal.Header>
          <Modal.Title>{rows.find((r) => r.slug === selected)?.name ?? selected}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="muted mb-4">Your recorded history · Entered manually</p>
          {selected &&
            selectedMeasurements
              .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
              .map((m) => {
                const disp = displayValue(m);
                return (
                  <div className="history-item" key={m.id}>
                    <strong>
                      {disp.value} {disp.unit}
                    </strong>
                    <p>{formatDate(m.observedAt)}</p>
                    {m.notes && <p>{m.notes}</p>}
                  </div>
                );
              })}
        </Modal.Body>
      </Modal>
    </>
  );
}
