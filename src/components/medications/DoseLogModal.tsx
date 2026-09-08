'use client';
import { useState, type FormEventHandler } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, SelectPicker } from 'rsuite';
import { FormError } from '../ui/FormError';
import { createDoseSchema } from '../../lib/validations/medications';
import type { Medicine } from '../../types';
import { localDateTime } from '../ui/format';

export function DoseLogModal({ medicine, scheduledTime, onClose }: { medicine: Medicine; scheduledTime?: string; onClose: () => void }) {
  const [status, setStatus] = useState<'Taken' | 'Skipped'>('Taken');

  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: import("../../lib/validations/medications").CreateDoseInput) => axios.post('/api/doses', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doses'] });
      onClose();
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const close = () => { if (!submitting) onClose(); };
  const onSubmit: FormEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();
    if (submitting) return;
    const fields = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {

      const when = String(fields.get('when') || '');
      const data = await createDoseSchema.validate({
        medicineId: medicine.id, status, scheduledTime,
        dose: fields.get('dose'), notes: fields.get('notes'),
        takenAt: when ? new Date(when).toISOString() : '',
      }, { stripUnknown: true });

      await mutation.mutateAsync(data);
    } catch (error) {
      setError(axios.isAxiosError(error) ? error.response?.data?.error || 'Could not save. Please try again.' : error instanceof Error ? error.message : 'Check your entry.');
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal open onClose={close} size="sm">
    <Modal.Header><Modal.Title>{'Log ' + medicine.name}</Modal.Title></Modal.Header>
    <Modal.Body><form className="entry-form" onSubmit={onSubmit} aria-busy={submitting}>
      <fieldset disabled={submitting} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className="entry-form">

        <label id="dose-status-label">Status</label>
        <SelectPicker aria-labelledby="dose-status-label" value={status} onChange={v => setStatus(v as 'Taken' | 'Skipped')} cleanable={false} searchable={false} disabled={submitting} data={['Taken', 'Skipped'].map(value => ({ value, label: value }))}/>
        <label>Dose<Input name="dose" required maxLength={200} defaultValue={medicine.dose}/></label>
        <label>Date and time<Input name="when" type="datetime-local" required defaultValue={localDateTime()} max={localDateTime()}/></label>

        <label>Notes <span className="optional">optional</span><Input as="textarea" rows={3} name="notes" maxLength={5000}/></label>
      </fieldset>
      <FormError message={error}/>
      <div className="form-actions"><Button onClick={close} disabled={submitting}>Cancel</Button><Button appearance="primary" type="submit" loading={submitting}>Add to log</Button></div>
    </form></Modal.Body>
  </Modal>;
}
