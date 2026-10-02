'use client';
import { usePatient } from '@/src/context/PatientContext';
import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal } from 'rsuite';
import { FormError } from '../ui/FormError';
import { createDoseSchema } from '../../lib/validations/medications';
import type { Medicine, DoseLog } from '../../types';
import { localDateTime } from '../ui/format';
export function DoseLogModal({
  medicine,
  log,
  onClose,
}: {
  medicine?: Medicine;
  log?: DoseLog;
  onClose: () => void;
}) {
  const { patientUrl } = usePatient();
  const client = useQueryClient();
  const [status, setStatus] = useState(log?.status ?? 'Taken');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fields = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const data = await createDoseSchema.validate({
        medicineId: log?.medicineId ?? medicine?.id ?? null,
        name: log?.name ?? medicine?.name ?? fields.get('name'),
        dose: fields.get('dose'),
        notes: fields.get('notes'),
        status,
        scheduledFor: log?.scheduledFor ?? null,
        scheduledTime: log?.scheduledTime ?? null,
        takenAt: status === 'Taken' ? new Date(String(fields.get('when'))).toISOString() : null,
      });
      if (log) await axios.patch(patientUrl(`/doses/${log.id}`), data);
      else await axios.post(patientUrl('/doses'), data);
      await Promise.all(
        ['doses', 'timeline'].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      onClose();
    } catch (e) {
      setError(
        axios.isAxiosError(e)
          ? (e.response?.data?.error ?? 'Could not save dose.')
          : e instanceof Error
            ? e.message
            : 'Check your entry.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onClose={() => !busy && onClose()} size="sm">
      <Modal.Header>
        <Modal.Title>
          {log
            ? 'Edit recorded dose'
            : medicine
              ? `Log ${medicine.name}`
              : 'Record one-off or unlisted medicine'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form className="entry-form" onSubmit={submit}>
          <fieldset disabled={busy} className="entry-form" style={{ border: 0, padding: 0 }}>
            {!medicine && !log && (
              <label>
                Medication name
                <Input name="name" required maxLength={200} />
              </label>
            )}
            <label>
              Dose
              <Input
                name="dose"
                required
                maxLength={200}
                defaultValue={log?.dose ?? medicine?.dose}
              />
            </label>
            {log && (
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Taken' | 'Skipped')}
                >
                  <option>Taken</option>
                  <option>Skipped</option>
                </select>
              </label>
            )}
            {log?.scheduledFor && (
              <p className="muted">Scheduled for {new Date(log.scheduledFor).toLocaleString()}</p>
            )}
            {status === 'Taken' && (
              <label>
                Actually taken at
                <Input
                  name="when"
                  type="datetime-local"
                  required
                  defaultValue={localDateTime(log?.takenAt ? new Date(log.takenAt) : new Date())}
                  max={localDateTime()}
                />
              </label>
            )}
            <label>
              Notes <span className="optional">optional</span>
              <Input as="textarea" name="notes" maxLength={5000} defaultValue={log?.notes} />
            </label>
          </fieldset>
          <FormError message={error} />
          <div className="form-actions">
            <Button disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" appearance="primary" loading={busy}>
              Save dose
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
