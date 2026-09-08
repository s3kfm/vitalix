'use client';
import { useState, type FormEventHandler } from 'react';
import { Modal } from '../Modals';
import { localDateTime } from '../ui/format';
const units: Readonly<Partial<Record<string, string>>> = { 'Blood pressure': 'mmHg', Weight: 'kg', Temperature: '°C', 'Resting heart rate': 'bpm', 'Blood glucose': 'mg/dL', 'Oxygen saturation': '%', 'Waist circumference': 'cm', 'Peak flow': 'L/min' };
export function MeasurementModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onClose();
  };
  return <Modal title="Add a measurement" onClose={onClose}><form className="entry-form" onSubmit={onSubmit}><label>Measurement<input required list="measurement-options" value={name} onChange={e => { setName(e.target.value); setUnit(units[e.target.value] ?? ''); }} placeholder="Choose a measurement or enter your own"/><datalist id="measurement-options">{Object.keys(units).map(n => <option key={n} value={n}/>)}</datalist></label><div className="form-grid">{name === 'Blood pressure' ? <><label>Systolic<input name="systolic" type="number" min="1" required placeholder="120"/></label><label>Diastolic<input name="diastolic" type="number" min="1" required placeholder="80"/></label></> : <label>Value<input name="value" required placeholder="e.g. 36.7"/></label>}<label>Unit<input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. °C"/></label></div><label>Date and time<input type="datetime-local" name="when" required defaultValue={localDateTime()}/></label><label>Notes <span className="optional">optional</span><textarea name="notes" placeholder={name === 'Blood glucose' ? 'Fasting, after a meal, or other context' : "Context you’d like to remember"}/></label><div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button">Add measurement</button></div></form></Modal>;
}
