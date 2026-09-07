'use client';
import { parseSymptomForm } from '../../lib/recordValidation';
import { useRecordForm } from '../../hooks/useRecordForm';
import { FormError } from '../ui/FormError';
import { Modal } from '../Modals';
import { localDateTime } from '../ui/format';
import { useHealthRecords } from '../../context/HealthRecordsContext';
export function SymptomLogModal({ onClose }: { onClose: () => void }) {
  const { addSymptom } = useHealthRecords();
  const { error, onSubmit } = useRecordForm({ parse: parseSymptomForm, save: addSymptom, onSuccess: onClose });
  return <Modal title="Log a symptom" onClose={onClose}><form className="entry-form" onSubmit={onSubmit}><FormError message={error}/><label>What are you experiencing?<input name="name" required list="symptom-options" placeholder="Search or enter any symptom"/><datalist id="symptom-options">{['Headache', 'Fatigue', 'Nausea', 'Back pain', 'Dizziness', 'Cramps'].map(s => <option key={s} value={s}/>)}</datalist></label><label>When did it happen?<input name="when" type="datetime-local" required defaultValue={localDateTime()}/></label><div className="form-grid"><label>Severity <span className="optional">optional</span><select name="severity"><option value="">Not specified</option>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i+1}>{i+1}{i === 0 ? ' · Very mild' : i === 9 ? ' · Worst imaginable' : ''}</option>)}</select></label><label>Location <span className="optional">optional</span><input name="location" placeholder="e.g. Temples"/></label></div><label className="checkbox-label"><input type="checkbox" name="ongoing"/>Still happening</label><label>Notes <span className="optional">optional</span><textarea name="notes" placeholder="Duration, what you were doing, or anything else" rows={3}/></label><div className="form-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button">Add entry</button></div></form></Modal>;
}
