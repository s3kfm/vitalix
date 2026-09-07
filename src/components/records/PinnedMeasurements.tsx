'use client';
import Link from 'next/link';
import { Pin } from 'lucide-react';
import { useHealthRecords } from '../../context/HealthRecordsContext';
import { formatDate } from '../ui/format';
import type { Measurement } from '../../types';
export function PinnedMeasurements() {
  const { measurements, togglePin } = useHealthRecords();
  const pinned = Array.from([...measurements].sort((a,b) => a.recordedAt.localeCompare(b.recordedAt)).reduce((map, m) => map.set(m.name, m), new Map<string, Measurement>()).values()).filter(m => m.pinned);
  return <section><div className="section-heading"><h2>Pinned measurements</h2><Link className="text-button" href="/vitals-and-labs">Manage pins ↗</Link></div><div className="pinned-grid">{pinned.map(m => <div className="measurement-card" key={m.id}><div><p>{m.name}</p><button aria-label={`Unpin ${m.name}`} onClick={() => togglePin(m.name)} className="pin-button is-pinned"><Pin size={15}/></button></div><Link href="/vitals-and-labs"><strong>{m.value}</strong><span>{m.unit}</span></Link><small>{formatDate(m.recordedAt)}</small></div>)}</div>{!pinned.length && <p className="muted">Pin a measurement from your records to see its latest reading here.</p>}</section>;
}
