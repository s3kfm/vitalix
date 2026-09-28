'use client';
import { useState, type FormEvent } from 'react';
import { Button, Drawer } from 'rsuite';
import {
  createCycleObservationSchema,
  type CreateCycleObservationInput,
} from '@/src/lib/validations/cycles';
import { dayKey, type CycleEntry } from '@/src/lib/cycles/presentation';
import { FormError } from '../ui/FormError';
const symptomOptions = [
  'Cramps',
  'Breast tenderness',
  'Bloating',
  'Headache',
  'Mood changes',
  'Acne',
  'Other',
];
function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [string, string])[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <fieldset className="cycle-choices">
      <legend>{label}</legend>
      <div>
        {options.map(([id, text]) => (
          <button
            type="button"
            key={id}
            aria-pressed={value === id}
            className={value === id ? 'selected' : ''}
            onClick={() => onChange(value === id ? null : id)}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
export function ObservationSheet({
  entry,
  day,
  onClose,
  onSave,
  onDelete,
}: {
  entry?: CycleEntry;
  day: string;
  onClose: () => void;
  onSave: (data: CreateCycleObservationInput, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [date, setDate] = useState(entry ? dayKey(entry.observedAt) : day);
  const [bleeding, setBleeding] = useState<string | null>(entry?.bleedingLevel ?? null);
  const [mucus, setMucus] = useState<string | null>(entry?.cervicalMucus ?? null);
  const [lh, setLh] = useState<string | null>(entry?.lhResult ?? null);
  const [temperature, setTemperature] = useState(entry?.basalTemperatureCelsius?.toString() ?? '');
  const [symptoms, setSymptoms] = useState<string[]>(entry?.symptoms ?? []);
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [periodStarted, setPeriodStarted] = useState(entry?.periodStarted ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = () => {
    if (!busy) onClose();
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (
      !entry &&
      !bleeding &&
      !mucus &&
      !lh &&
      !temperature &&
      !symptoms.length &&
      !notes.trim() &&
      !periodStarted
    ) {
      setError('Choose any one observation to save.');
      return;
    }
    const parsed = createCycleObservationSchema.safeParse({
      observedAt:
        entry && date === dayKey(entry.observedAt)
          ? entry.observedAt
          : date === dayKey(new Date())
            ? new Date().toISOString()
            : `${date}T00:00:00Z`,
      bleedingLevel: bleeding,
      cervicalMucus: mucus,
      lhResult: lh,
      basalTemperatureCelsius: temperature ? Number(temperature) : null,
      symptoms: symptoms.length ? symptoms : null,
      notes: notes.trim() || null,
      periodStarted: periodStarted || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your entry.');
      return;
    }
    setBusy(true);
    try {
      await onSave(parsed.data, entry?.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!entry) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete(entry.id);
      onClose();
    } catch {
      setError('Could not remove this observation. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer open placement="right" size="sm" onClose={close} className="cycle-drawer">
      <Drawer.Header>
        <Drawer.Title>{entry ? 'Edit observation' : 'Log an observation'}</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body>
        <form className="cycle-entry-form" onSubmit={submit} aria-busy={busy}>
          <p className="muted">One detail is enough. Leave anything else blank.</p>
          <fieldset disabled={busy} className="cycle-form-fields">
            <label className="cycle-field">
              Date
              <input
                type="date"
                value={date}
                max={dayKey(new Date())}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <small className="muted">Dates use UTC, matching your cycle calendar.</small>
            <Choices
              label="Bleeding"
              options={['none', 'spotting', 'light', 'medium', 'heavy'].map((v) => [
                v,
                v[0]!.toUpperCase() + v.slice(1),
              ])}
              value={bleeding}
              onChange={setBleeding}
            />
            <label className="cycle-check">
              <input
                type="checkbox"
                checked={periodStarted}
                onChange={(e) => setPeriodStarted(e.target.checked)}
              />
              My period started on this day
            </label>
            <Choices
              label="Cervical mucus"
              options={['dry', 'sticky', 'creamy', 'watery', 'egg_white'].map((v) => [
                v,
                v === 'egg_white' ? 'Egg-white' : v[0]!.toUpperCase() + v.slice(1),
              ])}
              value={mucus}
              onChange={setMucus}
            />
            <Choices
              label="LH test"
              options={['negative', 'positive', 'peak'].map((v) => [
                v,
                v[0]!.toUpperCase() + v.slice(1),
              ])}
              value={lh}
              onChange={setLh}
            />
            <details className="cycle-log-detail" open={temperature !== '' ? true : undefined}>
              <summary>Basal body temperature{temperature ? ` · ${temperature} °C` : ''}</summary>
              <label className="cycle-field">
                Temperature (°C)
                <input
                  type="number"
                  min="30"
                  max="45"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 36.45"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </label>
            </details>
            <details className="cycle-log-detail" open={symptoms.length ? true : undefined}>
              <summary>Symptoms{symptoms.length ? ` · ${symptoms.length} selected` : ''}</summary>
              <fieldset className="cycle-choices">
                <legend className="sr-only">Symptoms</legend>
                <div>
                  {[...new Set([...symptomOptions, ...symptoms])].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={symptoms.includes(value)}
                      className={symptoms.includes(value) ? 'selected' : ''}
                      onClick={() =>
                        setSymptoms((current) =>
                          current.includes(value)
                            ? current.filter((v) => v !== value)
                            : [...current, value],
                        )
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
            </details>
            <label className="cycle-field">
              Notes <span className="muted">optional</span>
              <textarea
                rows={3}
                maxLength={5000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want to remember"
              />
            </label>
          </fieldset>
          <FormError message={error} />
          <div className="form-actions">
            <Button onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button appearance="primary" type="submit" loading={busy}>
              {entry ? 'Save changes' : 'Save observation'}
            </Button>
          </div>
          {entry && (
            <div className="cycle-delete">
              {confirmDelete ? (
                <>
                  <p>Remove this observation? Your cycle and predictions will be recalculated.</p>
                  <Button
                    color="red"
                    appearance="ghost"
                    onClick={() => void remove()}
                    disabled={busy}
                  >
                    Remove observation
                  </Button>
                  <Button
                    appearance="subtle"
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy}
                  >
                    Keep it
                  </Button>
                </>
              ) : (
                <Button appearance="subtle" onClick={() => setConfirmDelete(true)} disabled={busy}>
                  Remove observation
                </Button>
              )}
            </div>
          )}
        </form>
      </Drawer.Body>
    </Drawer>
  );
}
