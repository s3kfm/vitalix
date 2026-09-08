'use client';
import { type FormEventHandler } from 'react';
import { Modal } from '../Modals';
import type { Medicine } from '../../types';
import { localDateTime } from '../ui/format';
export function DoseLogModal({ medicine, onClose }: { medicine: Medicine; scheduledTime?: string; onClose: () => void }) {
  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onClose();
  };
  return <Modal title={`Log ${medicine.name}`} onClose={onClose}><form className="entry-form" onSubmit={onSubmit}><label>Status<select name="status"><option>Taken</option><option>Skipped</option></select></label><label>Dose<input name="dose" required defaultValue={medicine.dose}/></label><label>Date and time<input name="when" type="datetime-local" required defaultValue={localDateTime()}/></label><label>Notes <span className="optional">optional</span><textarea name="notes" placeholder="Anything you’d like to remember"/></label><div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button">Add to log</button></div></form></Modal>;
}
