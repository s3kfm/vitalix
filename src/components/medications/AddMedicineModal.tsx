'use client';
import { useState, type FormEventHandler } from 'react';
import { Modal } from '../Modals';
export function AddMedicineModal({ onClose }: { onClose: () => void }) {
  const [scheduled, setScheduled] = useState(false);
  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onClose();
  };
  return <Modal title="Add medication" onClose={onClose}><form className="entry-form" onSubmit={onSubmit}><label>Name<input name="name" required placeholder="Medicine, vitamin, or supplement"/></label><div className="form-grid"><label>Strength<input name="strength" placeholder="e.g. 200 mg"/></label><label>Usual dose<input name="dose" required placeholder="e.g. 1 tablet"/></label></div><label>Schedule<select value={scheduled ? 'scheduled' : 'needed'} onChange={e => setScheduled(e.target.value === 'scheduled')}><option value="needed">As needed</option><option value="scheduled">Daily at a set time</option></select></label>{scheduled && <label>Time<input type="time" name="time" required defaultValue="08:00"/></label>}<label>Notes <span className="optional">optional</span><textarea name="notes" placeholder="Your existing instructions"/></label><div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button">Add medication</button></div></form></Modal>;
}
