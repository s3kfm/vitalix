'use client';
import Link from 'next/link';
import { Pin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useHealthRecords } from '../../context/HealthRecordsContext';
import type { MeasurementDefinition as Definition, ApiMeasurement } from '../../db/types';
import { displayMeasurement as displayValue } from '../../lib/measurements/display';
import { formatDate } from '../ui/format';

export function PinnedMeasurements() {
  const { togglePin } = useHealthRecords();

  // Fetch all definitions
  const definitions = useQuery<Definition[]>({
    queryKey: ['measurements', 'definitions'],
  });

  // Fetch latest measurement for each definition
  const latestQueries = useQuery<(ApiMeasurement | null)[]>({
    queryKey: ['measurements', 'latest', 'by-definition'],
    enabled: !!definitions.data?.length,
    queryFn: async () => {
      const slugs = definitions.data!.map(d => d.slug);
      return Promise.all(
        slugs.map(async (slug) => {
          try {
            const res = await fetch(`/api/measurements/latest?definitionSlug=${encodeURIComponent(slug)}`);
            if (!res.ok) return null;
            return await res.json() as ApiMeasurement | null;
          } catch { return null; }
        })
      );
    },
  });

  const measurements = (latestQueries.data ?? [])
    .map((m, i) => {
      const def = definitions.data?.[i];
      if (!m || !def) return null;
      const disp = displayValue(m);
      return {
        id: m.id,
        name: def.name,
        value: disp.value,
        unit: disp.unit,
        recordedAt: m.observedAt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const pinned = measurements; // all latest are shown as "pinned" on overview

  return (
    <section>
      <div className="section-heading">
        <h2>Pinned measurements</h2>
        <Link className="text-button" href="/vitals-and-labs">Manage pins ↗</Link>
      </div>
      <div className="pinned-grid">
        {pinned.map(m => (
          <div className="measurement-card" key={m.id}>
            <div>
              <p>{m.name}</p>
              <button
                aria-label={`Unpin ${m.name}`}
                onClick={() => togglePin(m.name)}
                className="pin-button is-pinned"
              >
                <Pin size={15} />
              </button>
            </div>
            <Link href="/vitals-and-labs">
              <strong>{m.value}</strong><span>{m.unit}</span>
            </Link>
            <small>{formatDate(m.recordedAt)}</small>
          </div>
        ))}
      </div>
      {!pinned.length && (
        <p className="muted">Pin a measurement from your records to see its latest reading here.</p>
      )}
    </section>
  );
}
