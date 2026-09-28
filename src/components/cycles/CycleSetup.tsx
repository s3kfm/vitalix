'use client';
import { useState, type FormEvent } from 'react';
import { Button, Modal } from 'rsuite';
import { cycleSetupSchema, type CycleSetupInput } from '@/src/lib/validations/cycles';
import { dayKey } from '@/src/lib/cycles/presentation';
import { FormError } from '../ui/FormError';
export function CycleSetup({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: CycleSetupInput) => Promise<void>;
}) {
  const [date, setDate] = useState('');
  const [length, setLength] = useState('');
  const [duration, setDuration] = useState('');
  const [regularity, setRegularity] = useState<CycleSetupInput['regularity']>('unknown');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = cycleSetupSchema.safeParse({
      lastPeriodStartedAt: date || null,
      typicalCycleLengthDays: length ? Number(length) : null,
      typicalPeriodLengthDays: duration ? Number(duration) : null,
      regularity,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your answers.');
      return;
    }
    setBusy(true);
    try {
      await onSave(parsed.data);
      onClose();
    } catch {
      setError('Could not save your answers. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      size="sm"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <Modal.Header>
        <Modal.Title>A little about your cycle</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={submit} className="cycle-entry-form">
          <p className="muted">
            Share what you know. You can leave every answer blank and let Vitalix learn over time.
          </p>
          <fieldset disabled={busy} className="cycle-form-fields">
            <label className="cycle-field">
              When did your most recent period start?
              <input
                type="date"
                max={dayKey(new Date())}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <small className="muted">Leave blank if you’re not sure.</small>
            </label>
            <label className="cycle-field">
              Usual days between period starts
              <input
                type="number"
                min="10"
                max="180"
                step="1"
                placeholder="Not sure"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </label>
            <label className="cycle-field">
              How many days does your period usually last?
              <input
                type="number"
                min="1"
                max="30"
                step="1"
                placeholder="Not sure"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>
            <fieldset className="cycle-choices">
              <legend>Are your cycles usually regular?</legend>
              <div>
                {(['regular', 'irregular', 'unknown'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={regularity === value}
                    className={regularity === value ? 'selected' : ''}
                    onClick={() => setRegularity(value)}
                  >
                    {value === 'unknown'
                      ? 'Not sure'
                      : value === 'regular'
                        ? 'Usually regular'
                        : 'They vary'}
                  </button>
                ))}
              </div>
            </fieldset>
          </fieldset>
          <FormError message={error} />
          <div className="form-actions">
            <Button onClick={onClose} disabled={busy}>
              Not now
            </Button>
            <Button type="submit" appearance="primary" loading={busy}>
              Start tracking
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
