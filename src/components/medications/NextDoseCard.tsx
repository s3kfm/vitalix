import { Clock } from 'lucide-react';
import type { Medicine, DoseLog } from '../../types';
import { timeLabel } from '../ui/format';
export function NextDoseCard({ medicines, doses }: { medicines: Medicine[]; doses: DoseLog[] }) {
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const next = medicines.filter(m => m.active).flatMap(m => m.schedule.map(time => ({ m, time }))).filter(({ m, time }) => time >= current && !doses.some(d => d.medicineId === m.id && d.scheduledTime === time && new Date(d.takenAt).toDateString() === now.toDateString())).sort((a,b) => a.time.localeCompare(b.time))[0];
  return <div className="summary-card"><span className="icon-tile peach"><Clock size={20}/></span><p>Next scheduled dose</p><strong className="small-value">{next ? timeLabel(next.time) : 'Nothing upcoming'}</strong><small>{next ? `${next.m.name} · ${next.m.dose}` : 'No more scheduled doses today'}</small></div>;
}
