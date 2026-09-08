'use client';

import { useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik, type FormikErrors } from 'formik';
import { SelectPicker } from 'rsuite';
import type { ComponentDefinition } from '../../lib/measurements/catalog';
import type { CreateMeasurementGroupInput } from '../../lib/validations/measurements';
import { initialDraft, resultFields, serializeResult, type ComponentDraft } from '../../lib/measurements/form';
import { localDateTime } from '../ui/format';
import { FormError } from '../ui/FormError';

interface Definition { slug: string; name: string; components: ComponentDefinition[] }
interface FormValues { definitionSlug: string; observedAt: string; notes: string; components: ComponentDraft[] }

export function MeasurementForm({ onSuccess, onCancel, onPendingChange }: { onSuccess?: () => void; onCancel?: () => void; onPendingChange?: (pending: boolean) => void }) {
  const container = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const toastId = useRef<string | number | undefined>(undefined);
  const definitions = useQuery({
    queryKey: ["measurements", "definitions"],
  });
  const mutation = useMutation({
    mutationFn: (payload: CreateMeasurementGroupInput) => axios.post('/api/measurements/group', payload),
    onMutate: () => {
      onPendingChange?.(true);
      toastId.current = toast.loading('Saving measurement…');
    },
    onError: () => {
      toast.error('Could not save measurement. Please try again.', { id: toastId.current });
    },
    onSettled: () => onPendingChange?.(false),
    onSuccess: () => {
      toast.success('Measurement added.', { id: toastId.current });
      void queryClient.invalidateQueries({ queryKey: ['measurements'] });
      onSuccess?.();
    },
  });
  const form = useFormik<FormValues>({
    initialValues: { definitionSlug: '', observedAt: localDateTime(), notes: '', components: [] },
    validate: values => {
      const errors: FormikErrors<FormValues> = {};
      const definition = definitions.data?.find(item => item.slug === values.definitionSlug);
      if (!definition) errors.definitionSlug = 'Choose a measurement type.';
      if (!values.observedAt || Number.isNaN(new Date(values.observedAt).getTime())) errors.observedAt = 'Enter a valid date and time.';
      const componentErrors = definition?.components.map((component, index) => {
        try { serializeResult(component, values.components[index] ?? {}); return ''; }
        catch (error) { return error instanceof Error ? error.message : 'Check this result.'; }
      });
      if (componentErrors?.some(Boolean)) errors.components = componentErrors;
      return errors;
    },
    onSubmit: async values => {
      const definition = definitions.data!.find(item => item.slug === values.definitionSlug)!;
      try {
        await mutation.mutateAsync({
          source: 'manual',
          observations: [{
            definitionSlug: definition.slug,
            observedAt: new Date(values.observedAt).toISOString(),
            notes: values.notes.trim() || undefined,
            values: definition.components.map((component, index) => ({
              componentKey: component.key,
              result: serializeResult(component, values.components[index]!),
            })),
          }],
        });
        form.resetForm();
      } catch { /* The mutation error is displayed without discarding the inputs. */ }
    },
  });
  const definition = definitions.data?.find(item => item.slug === form.values.definitionSlug);
  const error = mutation.error;
  const errorMessage = axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error || 'Could not save the measurement. Please try again.'
    : error ? 'Could not save the measurement. Please try again.' : null;

  return <form ref={container} className="entry-form" aria-busy={form.isSubmitting} onSubmit={form.handleSubmit} noValidate>
    <label id="measurement-type-label">Measurement type</label>
    <SelectPicker
      aria-labelledby="measurement-type-label"
      data={(definitions.data ?? []).map(item => ({ label: item.name, value: item.slug }))}
      value={form.values.definitionSlug || null}
      loading={definitions.isPending}
      disabled={form.isSubmitting}
      block
      onChange={slug => {
        const selected = definitions.data?.find(item => item.slug === slug);
        mutation.reset();
        form.resetForm({ values: { ...form.values, definitionSlug: slug ?? '', components: selected?.components.map(initialDraft) ?? [] } });
      }}
      placeholder="Choose a measurement"
    />
    {definitions.isError && <><FormError message="Could not load measurement types." /><button type="button" className="button secondary" onClick={() => void definitions.refetch()}>Retry</button></>}
    {definitions.isSuccess && !definitions.data.length && <FormError message="No measurement types are available." />}
    <FormError message={form.submitCount ? form.errors.definitionSlug ?? null : null} />
    {definition?.components.map((component, index) => <fieldset key={`${definition.slug}-${component.key}`} disabled={form.isSubmitting}>
      <legend>{component.name}</legend>
      <div className="flex gap-2">{resultFields(component.resultType).map(field => {
        const value = form.values.components[index]?.[field.key] ?? '';
        const change = (next: string) => void form.setFieldValue(`components.${index}`, { ...form.values.components[index], [field.key]: next });
        return <label key={field.key}>{field.label}
          {field.kind === 'comparator'
            ? <SelectPicker
              data={['=', '<', '<=', '>=', '>'].map(item => ({ label: item, value: item }))}
              value={value || null}
              cleanable
              searchable={false}
              disabled={form.isSubmitting}
              block
              onChange={val => change(val ?? '')}
              placeholder="="
            />
            : field.kind === 'boolean'
              ? <select value={value} onChange={event => change(event.target.value)}>
                <option value="">Choose a result</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              : <input type={field.kind} step={component.resultType === 'integer' ? '1' : field.kind === 'time' ? '1' : 'any'} value={value} onChange={event => change(event.target.value)} />}
        </label>;
      })}</div>
      {!resultFields(component.resultType).length && <FormError message={`Manual entry for ${component.resultType} is not supported yet.`} />}
      <FormError message={form.submitCount && Array.isArray(form.errors.components) && typeof form.errors.components[index] === 'string' ? form.errors.components[index] as string : null} />
    </fieldset>)}
    <label>Date and time<input type="datetime-local" {...form.getFieldProps('observedAt')} disabled={form.isSubmitting} /></label>
    <FormError message={form.submitCount ? form.errors.observedAt ?? null : null} />
    <label>Notes <span className="optional">optional</span><textarea {...form.getFieldProps('notes')} disabled={form.isSubmitting} /></label>
    <FormError message={errorMessage} />
    {mutation.isSuccess && <p role="status">Measurement saved.</p>}
    <div className="form-actions">
      {onCancel && <button type="button" className="button secondary" onClick={onCancel} disabled={form.isSubmitting}>Cancel</button>}
      <button type="submit" className="button" disabled={form.isSubmitting || !definition || definition.components.some(component => !resultFields(component.resultType).length)}>{form.isSubmitting ? 'Saving…' : 'Add measurement'}</button>
    </div>
  </form>;
}
