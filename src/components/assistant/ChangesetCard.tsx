'use client';

import { usePatient } from '@/src/context/PatientContext';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, CircleAlert, LoaderCircle } from 'lucide-react';
import {
  changesetSchema,
  recordDetails,
  recordTitle,
  type Changeset,
  type ConfirmationResult,
  type SaveResult,
} from '@/src/lib/assistant/changeset';
import { saveChangeset } from '@/src/lib/assistant/save';

export function ChangesetCard({
  changeset,
  output,
  disabled,
  onResult,
  onEdit,
  onSavingChange,
}: {
  changeset: Changeset;
  output?: ConfirmationResult;
  disabled: boolean;
  onResult: (result: ConfirmationResult) => void;
  onEdit: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const { patientUrl } = usePatient();
  const [results, setResults] = useState<SaveResult[]>([]);
  const [saving, setSaving] = useState(false);
  const guard = useRef(false);
  const queryClient = useQueryClient();
  const parsed = changesetSchema.safeParse(changeset);
  if (!parsed.success)
    return (
      <div className="assistant-review">
        <p role="alert">This proposal is incomplete. Ask the assistant to try again.</p>
        <button
          className="button secondary"
          disabled={disabled}
          onClick={() => onResult({ status: 'cancelled', records: [] })}
        >
          Dismiss proposal
        </button>
      </div>
    );
  const data = parsed.data;
  const shownResults = output?.records ?? results;
  const saved = shownResults.filter((result) => result.status === 'saved').length;
  const uncertain = shownResults.some((result) => result.status === 'uncertain');
  const retryable = results.some((result) => result.status === 'failed');
  const save = async () => {
    if (guard.current || disabled || output) return;
    guard.current = true;
    setSaving(true);
    onSavingChange(true);
    try {
      const next = await saveChangeset(data, patientUrl, results, setResults);
      // Refresh even uncertain saves: the response may have been lost after a write.
      await Promise.all(
        ['symptoms', 'medications', 'doses', 'measurements', 'timeline'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      );
      if (next.every((result) => result.status === 'saved'))
        onResult({ status: 'saved', records: next });
    } finally {
      guard.current = false;
      setSaving(false);
      onSavingChange(false);
    }
  };
  const finish = () =>
    onResult({ status: results.length ? 'partial' : 'cancelled', records: results });
  return (
    <section
      className="assistant-review"
      aria-label="Review proposed health records"
      aria-busy={saving}
    >
      <div className="assistant-review-heading">
        <span className="eyebrow">
          {output?.status === 'cancelled'
            ? 'Cancelled'
            : output
              ? 'Save results'
              : 'Review before saving'}
        </span>
        <span>
          {data.records.length} {data.records.length === 1 ? 'record' : 'records'}
        </span>
      </div>
      <p>{data.summary}</p>
      <div className="assistant-records">
        {data.records.map((record) => {
          const result = shownResults.find((item) => item.key === record.key);
          return (
            <article className="assistant-record" key={record.key}>
              <div className="assistant-record-heading">
                <span className="assistant-record-kind">{record.kind}</span>
                {result?.status === 'saved' && (
                  <span className="assistant-saved">
                    <Check size={14} />
                    Saved
                  </span>
                )}
              </div>
              <h4>{recordTitle(record)}</h4>
              <dl>
                {recordDetails(record, data.records).map(([label, value], index) => (
                  <div key={`${label}-${index}`}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {result?.error && (
                <p className="assistant-record-error" role="status">
                  <CircleAlert size={14} />
                  {result.error}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {!output && (
        <>
          <p className="assistant-review-note">
            {results.length
              ? `${saved} of ${data.records.length} saved.${uncertain ? ' Some saves could not be verified; check the relevant page before adding them again.' : ''}`
              : 'Only these records will be added. Dates and times are shown in your local timezone.'}
          </p>
          <div className="assistant-review-actions">
            {(!results.length || retryable) && (
              <button
                type="button"
                className="button"
                disabled={disabled || saving}
                onClick={() => void save()}
              >
                {saving ? (
                  <>
                    <LoaderCircle className="assistant-spin" size={15} />
                    Saving…
                  </>
                ) : results.length ? (
                  'Retry failed records'
                ) : (
                  'Confirm & save'
                )}
              </button>
            )}
            {!results.length && (
              <button
                type="button"
                className="button secondary"
                disabled={disabled || saving}
                onClick={() => {
                  finish();
                  onEdit();
                }}
              >
                Make changes
              </button>
            )}
            <button
              type="button"
              className="assistant-text-button"
              disabled={disabled || saving}
              onClick={finish}
            >
              {results.length ? 'Done' : 'Cancel'}
            </button>
          </div>
        </>
      )}
      {output && (
        <p className="assistant-review-note" role="status">
          {output.status === 'cancelled'
            ? 'This proposal was cancelled. No records were added.'
            : `${saved} of ${data.records.length} records saved.`}
        </p>
      )}
    </section>
  );
}
