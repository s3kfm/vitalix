'use client';
import { useState, type FormEventHandler } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, SelectPicker } from 'rsuite';
import { FormError } from '../ui/FormError';
import { createMedicationSchema } from '../../lib/validations/medications';

export function AddMedicineModal({ onClose }: { onClose: () => void }) {
  const [scheduled, setScheduled] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: import("../../lib/validations/medications").CreateMedicationInput) => axios.post('/api/medications', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['medications'] });
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

      const data = await createMedicationSchema.validate({
        name: fields.get('name'), strength: fields.get('strength'), dose: fields.get('dose'),
        schedule: scheduled ? [fields.get('time')] : [], notes: fields.get('notes'),
      }, { stripUnknown: true });

      await mutation.mutateAsync(data);
    } catch (error) {
      setError(axios.isAxiosError(error) ? error.response?.data?.error || 'Could not save. Please try again.' : error instanceof Error ? error.message : 'Check your entry.');
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal open onClose={close} size="sm">
    <Modal.Header><Modal.Title>Add medication</Modal.Title></Modal.Header>
    <Modal.Body><form className="entry-form" onSubmit={onSubmit} aria-busy={submitting}>
      <fieldset disabled={submitting} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className="entry-form">

        <label>Name<Input name="name" required maxLength={200} placeholder="Medicine, vitamin, or supplement" autoFocus/></label>
        <div className="form-grid"><label>Strength<Input name="strength" maxLength={200} placeholder="e.g. 200 mg"/></label><label>Usual dose<Input name="dose" required maxLength={200} placeholder="e.g. 1 tablet"/></label></div>
        <label id="medication-schedule-label">Schedule</label>
        <SelectPicker aria-labelledby="medication-schedule-label" value={scheduled ? 'scheduled' : 'needed'} onChange={v => setScheduled(v === 'scheduled')} cleanable={false} searchable={false} disabled={submitting} data={[{value: 'needed', label: 'As needed'}, {value: 'scheduled', label: 'Daily at a set time'}]}/>
        {scheduled && <label>Time<Input type="time" name="time" required defaultValue="08:00"/></label>}

        <label>Notes <span className="optional">optional</span><Input as="textarea" rows={3} name="notes" maxLength={5000}/></label>
      </fieldset>
      <FormError message={error}/>
      <div className="form-actions"><Button onClick={close} disabled={submitting}>Cancel</Button><Button appearance="primary" type="submit" loading={submitting}>Add medication</Button></div>
    </form></Modal.Body>
  </Modal>;
}
