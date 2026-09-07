import { Pill, Check } from 'lucide-react';
import type { Medicine, DoseLog } from '../../types';
import { timeLabel } from '../ui/format';
export function MedicineRow({ medicine, time, log, onLog }: { medicine: Medicine; time?: string; log?: DoseLog; onLog: () => void }) {
  return <div className="medicine-row"><span className="icon-tile"><Pill size={20}/></span><div className="row-main"><strong>{medicine.name} <span className="muted font-normal">{medicine.strength}</span></strong><p>{medicine.dose}{medicine.notes ? ` · ${medicine.notes}` : ''}</p></div><span className="dose-time">{time ? timeLabel(time) : 'As needed'}</span>{log ? <span className="badge"><Check size={13}/>{log.status}</span> : <button className="button secondary small" onClick={onLog}>Log dose</button>}</div>;
}
