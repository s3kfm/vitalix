'use client';
import { usePatient } from '@/src/context/PatientContext';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { Button, Checkbox, Input, Modal, SelectPicker } from 'rsuite';
import { toast } from 'sonner';
import { createSymptomSchema, type CreateSymptomInput } from '../../lib/validations/symptoms';
import { localDateTime } from '../ui/format';
import { FormError } from '../ui/FormError';

export function SymptomLogModal({ onClose }: { onClose: () => void }) {
  const { patientUrl } = usePatient();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: CreateSymptomInput) => axios.post(patientUrl('/symptoms'), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      void queryClient.invalidateQueries({ queryKey: ['timeline'] });
      toast.success('Symptom logged.');
      onClose();
    },
  });
  const form = useFormik({
    initialValues: {
      name: '',
      onsetAt: localDateTime(),
      resolvedAt: '',
      ongoing: true,
      severity: null as number | null,
      location: '',
      notes: '',
    },
    onSubmit: async (values) => {
      try {
        const payload = await createSymptomSchema.validate(
          {
            ...values,
            onsetAt: values.onsetAt ? new Date(values.onsetAt).toISOString() : '',
            resolvedAt: values.ongoing
              ? null
              : values.resolvedAt
                ? new Date(values.resolvedAt).toISOString()
                : '',
          },
          { stripUnknown: true },
        );
        form.setStatus(null);
        await mutation.mutateAsync(payload);
      } catch (error) {
        form.setStatus(
          axios.isAxiosError(error)
            ? error.response?.data?.error || 'Could not save symptom. Please try again.'
            : error instanceof Error
              ? error.message
              : 'Check your entry.',
        );
      }
    },
  });
  const close = () => {
    if (!form.isSubmitting) onClose();
  };
  return (
    <Modal open onClose={close} size="sm">
      <Modal.Header>
        <Modal.Title>Log a symptom</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form className="entry-form" onSubmit={form.handleSubmit} aria-busy={form.isSubmitting}>
          <label htmlFor="symptom-name">What are you experiencing?</label>
          <Input
            id="symptom-name"
            value={form.values.name}
            onChange={(value) => void form.setFieldValue('name', value)}
            placeholder="e.g. Headache"
            maxLength={200}
            disabled={form.isSubmitting}
            autoFocus
          />
          <label>
            When did it start?
            <Input
              type="datetime-local"
              {...form.getFieldProps('onsetAt')}
              onChange={(value) => void form.setFieldValue('onsetAt', value)}
              disabled={form.isSubmitting}
            />
          </label>
          <label id="symptom-severity-label">
            Severity <span className="optional">optional · 1 very mild, 10 worst imaginable</span>
          </label>
          <SelectPicker
            aria-labelledby="symptom-severity-label"
            block
            searchable={false}
            data={Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}/10`, value: i + 1 }))}
            value={form.values.severity}
            onChange={(value) => void form.setFieldValue('severity', value)}
            disabled={form.isSubmitting}
            placeholder="Not specified"
          />
          <label htmlFor="symptom-location">
            Location <span className="optional">optional</span>
          </label>
          <Input
            id="symptom-location"
            value={form.values.location}
            onChange={(value) => void form.setFieldValue('location', value)}
            placeholder="e.g. Temples"
            maxLength={200}
            disabled={form.isSubmitting}
          />
          <Checkbox
            checked={form.values.ongoing}
            onChange={(_, checked) => void form.setFieldValue('ongoing', checked)}
            disabled={form.isSubmitting}
          >
            Still happening
          </Checkbox>
          {!form.values.ongoing && (
            <label>
              When did it end?
              <Input
                type="datetime-local"
                value={form.values.resolvedAt}
                onChange={(value) => void form.setFieldValue('resolvedAt', value)}
                disabled={form.isSubmitting}
              />
            </label>
          )}
          <label htmlFor="symptom-notes">
            Notes <span className="optional">optional</span>
          </label>
          <Input
            id="symptom-notes"
            as="textarea"
            rows={3}
            value={form.values.notes}
            onChange={(value) => void form.setFieldValue('notes', value)}
            maxLength={5000}
            disabled={form.isSubmitting}
          />
          <FormError message={form.status ?? null} />
          <div className="form-actions">
            <Button onClick={close} disabled={form.isSubmitting}>
              Cancel
            </Button>
            <Button appearance="primary" type="submit" loading={form.isSubmitting}>
              Add entry
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
