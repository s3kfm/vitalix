'use client';
import { parseDoseForm } from '../../lib/recordValidation';
import { useRecordForm } from '../../hooks/useRecordForm';
import { FormError } from '../ui/FormError';
import { Modal } from '../Modals';
import { useHealthRecords } from '../../context/HealthRecordsContext';
import type { Medicine } from '../../types';
import { localDateTime } from '../ui/format';
export function DoseLogModal({ medicine, scheduledTime, onClose }: { medicine: Medicine; scheduledTime?: string; onClose: () => void }) {
  const { logDose } = useHealthRecords();
  const { error, onSubmit } = useRecordForm({ parse: data => parseDoseForm(data, medicine, scheduledTime), save: logDose, onSuccess: onClose });
  return <Modal title={`Log ${medicine.name}`} onClose={onClose}><form className="entry-form" onSubmit={onSubmit}><FormError message={error}/><label>Status<select name="status"><option>Taken</option><option>Skipped</option></select></label><label>Dose<input name="dose" required defaultValue={medicine.dose}/></label><label>Date and time<input name="when" type="datetime-local" required defaultValue={localDateTime()}/></label><label>Notes <span className="optional">optional</span><textarea name="notes" placeholder="Anything you’d like to remember"/></label><div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button">Add to log</button></div></form></Modal>;
}
