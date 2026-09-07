import { Pill } from 'lucide-react';
import type { Medicine } from '../../types';
export function TotalActiveMedicationsCard({ medicines }: { medicines: Medicine[] }) {
  const active = medicines.filter(m => m.active);
  return <div className="summary-card"><span className="icon-tile"><Pill size={20}/></span><p>Active medications</p><strong>{active.length}</strong><small>{active.filter(m => m.schedule.length).length} scheduled · {active.filter(m => !m.schedule.length).length} as needed</small></div>;
}
