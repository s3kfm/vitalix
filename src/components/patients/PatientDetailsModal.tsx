'use client';

import { useState, type FormEvent } from 'react';
import { Modal, Button, Input } from 'rsuite';
import { usePatient } from '@/src/context/PatientContext';
import { defaultPatientModules, patientModules, type Patient, type PatientModule } from '@/src/lib/patients';

export function PatientDetailsModal({ patient, onClose }: { patient?: Patient; onClose: () => void }) {
  const { enrollPatient, updatePatient } = usePatient();
  const [name, setName] = useState(patient?.name ?? '');
  const [knownAllergies, setKnownAllergies] = useState(patient?.knownAllergies ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(patient?.dateOfBirth ?? '');
  const [enabledModules, setEnabledModules] = useState<PatientModule[]>(patient?.enabledModules ?? [...defaultPatientModules]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const details = { name: name.trim(), knownAllergies, dateOfBirth: dateOfBirth || null, enabledModules };
      if (patient) await updatePatient(patient.id, details);
      else await enrollPatient(details);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save patient.');
      setSaving(false);
    }
  }
  return <Modal open onClose={() => { if (!saving) onClose(); }} size="xs">
    <Modal.Header><Modal.Title>{patient ? 'Edit patient' : 'Enroll patient'}</Modal.Title></Modal.Header>
    <form onSubmit={save}>
      <Modal.Body>
        <div style={{ display: 'grid', gap: 12 }}>
          <label htmlFor="patient-name">Name</label>
          <Input id="patient-name" value={name} onChange={setName} maxLength={200} required autoFocus disabled={saving} />
          <label htmlFor="patient-allergies">Known Allergies</label>
          <Input as="textarea" rows={3} id="patient-allergies" value={knownAllergies} onChange={setKnownAllergies} maxLength={5000} disabled={saving} placeholder="List known allergies, or leave blank if unknown" />
          <label htmlFor="patient-dob">Date of Birth</label>
          <Input id="patient-dob" type="date" value={dateOfBirth} onChange={setDateOfBirth} min="0001-01-01" max={new Date().toISOString().slice(0, 10)} disabled={saving} />
          <fieldset style={{ display: 'grid', gap: 10, padding: 12 }} disabled={saving}>
            <legend>Modules Enabled</legend>
            {patientModules.map(module => <label key={module.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <input type="checkbox" checked={module.id === 'timeline' || enabledModules.includes(module.id)} disabled={module.id === 'timeline'}
                onChange={event => setEnabledModules(current => event.target.checked ? [...current, module.id] : current.filter(id => id !== module.id))} />
              <span>{module.label}{module.description && <small style={{ display: 'block' }}>{module.description}</small>}</span>
            </label>)}
          </fieldset>
          <small>Module preferences are saved for future use.</small>
          {error && <p role="alert">{error}</p>}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="subtle" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button appearance="primary" type="submit" loading={saving} disabled={!name.trim()}>{patient ? 'Save changes' : 'Enroll patient'}</Button>
      </Modal.Footer>
    </form>
  </Modal>;
}
