'use client';
import { useState } from 'react';
import { Pin } from 'lucide-react';
import type { Measurement } from '../../types';
import { useHealthRecords } from '../../context/HealthRecordsContext';
import { formatDate } from '../ui/format';
import { Modal } from '../Modals';
import { EmptyState } from '../ui/EmptyState';
export function MeasurementTable({ query }: { query: string }) {
  const { measurements, togglePin } = useHealthRecords();
  const [selected, setSelected] = useState<string | null>(null);
  const latest = Array.from([...measurements].sort((a,b) => a.recordedAt.localeCompare(b.recordedAt)).reduce((map, m) => map.set(m.name, m), new Map<string, Measurement>()).values()).filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
  return <><div className="table-scroll"><table><thead><tr><th>Measurement</th><th>Latest reading</th><th>Recorded</th><th>Source</th><th>Pin</th></tr></thead><tbody>{latest.map(m => <tr key={m.id}><td><button className="text-button" onClick={() => setSelected(m.name)}>{m.name}</button></td><td><strong className="reading">{m.value}</strong> <span className="muted">{m.unit}</span></td><td>{formatDate(m.recordedAt)}</td><td><span className="badge neutral">Manual entry</span></td><td><button className={`pin-button ${m.pinned ? 'is-pinned' : ''}`} aria-label={`${m.pinned ? 'Unpin' : 'Pin'} ${m.name}`} aria-pressed={m.pinned} onClick={() => togglePin(m.name)}><Pin size={16}/></button></td></tr>)}</tbody></table></div>{!latest.length && <EmptyState title="No measurements found" description="Add any measurement you’d like to keep track of."/>}{selected && <Modal title={selected} onClose={() => setSelected(null)}><p className="muted mb-4">Your recorded history · Entered manually</p>{measurements.filter(m => m.name === selected).sort((a,b) => b.recordedAt.localeCompare(a.recordedAt)).map(m => <div className="history-item" key={m.id}><strong>{m.value} {m.unit}</strong><p>{formatDate(m.recordedAt)}</p>{m.notes && <p>{m.notes}</p>}</div>)}</Modal>}</>;
}
