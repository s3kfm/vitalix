import { HeartPulse } from 'lucide-react';
import type { SymptomEntry } from '../../types';
import { formatDate } from '../ui/format';
export function SymptomRow({ symptom, onResolve }: { symptom: SymptomEntry; onResolve: () => void }) {
  return <article className="symptom-row"><span className="icon-tile peach"><HeartPulse size={20}/></span><div className="row-main"><div className="inline-title"><h3>{symptom.name}</h3>{symptom.severity && <span className="badge neutral">{symptom.severity}/10</span>}</div><p>{formatDate(symptom.recordedAt)}{symptom.location && ` · ${symptom.location}`}</p>{symptom.notes && <p className="symptom-notes">{symptom.notes}</p>}</div>{symptom.ongoing ? <button className="button secondary small" onClick={onResolve}>Mark resolved</button> : <span className="badge neutral">Ended</span>}</article>;
}
