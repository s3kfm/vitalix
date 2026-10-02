'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, Checkbox, Message } from 'rsuite';
import { usePatient } from '@/src/context/PatientContext';
import {
  defaultPatientModules,
  patientModules,
  type Patient,
  type PatientModule,
} from '@/src/lib/patients';

export function PatientDetailsForm({
  patient,
  onComplete,
  onCancel,
  onSavingChange,
}: {
  patient?: Patient;
  onComplete: () => void;
  onCancel?: () => void;
  onSavingChange?: (saving: boolean) => void;
}) {
  const { enrollPatient, updatePatient } = usePatient();
  const [name, setName] = useState(patient?.name ?? '');
  const [knownAllergies, setKnownAllergies] = useState(patient?.knownAllergies ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(patient?.dateOfBirth ?? '');
  const [enabledModules, setEnabledModules] = useState<PatientModule[]>(
    patient?.enabledModules ?? [...defaultPatientModules],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    onSavingChange?.(true);
    setError(null);
    try {
      const details = {
        name: name.trim(),
        knownAllergies,
        dateOfBirth: dateOfBirth || null,
        enabledModules,
      };
      if (patient) await updatePatient(patient.id, details);
      else await enrollPatient(details);
      onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save patient.');
      setSaving(false);
      onSavingChange?.(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="patient-details-fields">
        <label htmlFor="patient-name">
          Patient name <span aria-hidden="true">*</span>
        </label>
        <Input
          id="patient-name"
          value={name}
          onChange={setName}
          maxLength={200}
          required
          placeholder="Enter full name"
          autoComplete="name"
          autoFocus
          disabled={saving}
        />
        <label htmlFor="patient-allergies">
          Known allergies <span className="muted">· Optional</span>
        </label>
        <Input
          as="textarea"
          rows={3}
          id="patient-allergies"
          value={knownAllergies}
          onChange={setKnownAllergies}
          maxLength={5000}
          disabled={saving}
          placeholder="List known allergies, or leave blank if unknown"
        />
        <label htmlFor="patient-dob">
          Date of birth <span className="muted">· Optional</span>
        </label>
        <Input
          id="patient-dob"
          type="date"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          min="0001-01-01"
          max={new Date().toISOString().slice(0, 10)}
          disabled={saving}
        />
        <fieldset className="patient-module-options" disabled={saving}>
          <legend>Make room for what matters</legend>
          <p className="muted">Choose what you’d like to track.</p>
          {patientModules.map((module) => (
            <Checkbox
              key={module.id}
              checked={module.id === 'timeline' || enabledModules.includes(module.id)}
              disabled={saving || module.id === 'timeline'}
              onChange={(_, checked) =>
                setEnabledModules((current) =>
                  checked ? [...current, module.id] : current.filter((id) => id !== module.id),
                )
              }
            >
              <span>
                {module.label}
                {module.description && <small>{module.description}</small>}
              </span>
            </Checkbox>
          ))}
        </fieldset>
        <small>Module preferences are saved for future use.</small>
        {error && (
          <Message type="error" role="alert" showIcon>
            {error}
          </Message>
        )}
      </div>

      <div className="patient-form-actions">
        {onCancel && (
          <Button appearance="subtle" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          appearance="primary"
          type="submit"
          loading={saving}
          disabled={saving || !name.trim()}
        >
          {patient ? 'Save changes' : 'Enroll patient'}
        </Button>
      </div>
    </form>
  );
}
