'use client';
import { parseMedicineForm } from '../../lib/recordValidation';
import { useRecordForm } from '../../hooks/useRecordForm';
import { FormError } from '../ui/FormError';
import { useState } from 'react';
import { Modal } from '../Modals';
import { useHealthRecords } from '../../context/HealthRecordsContext';
export function AddMedicineModal({ onClose }: { onClose: () => void }) {
  const { addMedicine } = useHealthRecords();
  const [scheduled, setScheduled] = useState(false);
  const { error, onSubmit } = useRecordForm({ parse: data => parseMedicineForm(data, scheduled), save: addMedicine, onSuccess: onClose });
  return <Modal title="Add medication" onClose={onClose}><form className="entry-form" onSubmit={onSubmit}><FormError message={error}/><label>Name<input name="name" required placeholder="Medicine, vitamin, or supplement"/></label><div className="form-grid"><label>Strength<input name="strength" placeholder="e.g. 200 mg"/></label><label>Usual dose<input name="dose" required placeholder="e.g. 1 tablet"/></label></div><label>Schedule<select value={scheduled ? 'scheduled' : 'needed'} onChange={e => setScheduled(e.target.value === 'scheduled')}><option value="needed">As needed</option><option value="scheduled">Daily at a set time</option></select></label>{scheduled && <label>Time<input type="time" name="time" required defaultValue="08:00"/></label>}<label>Notes <span className="optional">optional</span><textarea name="notes" placeholder="Your existing instructions"/></label><div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button">Add medication</button></div></form></Modal>;
}
