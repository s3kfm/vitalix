'use client';
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button, Input, Loader, Modal } from 'rsuite';
import { FileText, Plus } from 'lucide-react';
import { usePatient } from '@/src/context/PatientContext';
import type { Serialized } from '../../db/types';
import type { prescriptions } from '../../db/medications';
import { localDay } from '../../lib/medications/schedule';
type Prescription = Omit<Serialized<typeof prescriptions.$inferSelect>, 'attachmentData'>;
export function Prescriptions() {
  const { patientUrl } = usePatient();
  const client = useQueryClient();
  const query = useQuery<Prescription[]>({ queryKey: ['prescriptions'] });
  const [adding, setAdding] = useState(false);
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const items = Array.from({ length: count }, (_, i) => ({
      name: form.get(`name${i}`),
      dose: form.get(`dose${i}`),
      quantity: form.get(`quantity${i}`),
      refills: Number(form.get(`refills${i}`)),
    }));
    form.set(
      'record',
      JSON.stringify({
        prescriber: form.get('prescriber'),
        issuedOn: form.get('issuedOn'),
        validUntil: form.get('validUntil') || null,
        reference: form.get('reference'),
        active: form.get('status') === 'Current',
        items,
      }),
    );
    try {
      await axios.post(patientUrl('/prescriptions'), form);
      await client.invalidateQueries({ queryKey: ['prescriptions'] });
      setAdding(false);
    } catch (e) {
      setError(
        axios.isAxiosError(e)
          ? (e.response?.data?.error ?? 'Could not save prescription.')
          : 'Could not save prescription.',
      );
    } finally {
      setBusy(false);
    }
  }
  const today = localDay(new Date());
  const current = (p: Prescription) => p.active && (!p.validUntil || p.validUntil >= today);
  const date = (v: string) =>
    new Date(`${v}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  return (
    <div className="med-routine">
      <div className="med-group-heading">
        <p className="muted">Medications prescribed by your healthcare practitioner.</p>
        <button
          className="button secondary small"
          onClick={() => {
            setCount(1);
            setError(null);
            setAdding(true);
          }}
        >
          <Plus size={14} />
          Add prescription
        </button>
      </div>
      {query.isPending && <Loader content="Loading prescriptions…" />}
      {query.isError && (
        <p role="alert">
          Could not load prescriptions.{' '}
          <button className="text-button" onClick={() => void query.refetch()}>
            Retry
          </button>
        </p>
      )}
      {[true, false].map((active) => (
        <section className="med-group" key={String(active)}>
          <div className="med-group-heading">
            <h2>{active ? 'Current prescriptions' : 'Past prescriptions'}</h2>
          </div>
          {(query.data ?? [])
            .filter((p) => current(p) === active)
            .map((p) => (
              <article className="dose-card" key={p.id}>
                <div className="dose-main">
                  <span className="icon-tile">
                    <FileText size={19} />
                  </span>
                  <div className="dose-copy">
                    <strong>{p.prescriber}</strong>
                    <p>{p.reference ? `Rx / reference ${p.reference}` : 'Prescription'}</p>
                  </div>
                  <span className="badge neutral">{active ? 'Current' : 'Past'}</span>
                </div>
                <div className="prescription-meta">
                  <span>Issued {date(p.issuedOn)}</span>
                  {p.validUntil && <span>Valid until {date(p.validUntil)}</span>}
                </div>
                <div className="prescription-items">
                  {p.items.map((item, i) => (
                    <div className="dose-copy" key={i}>
                      <strong>{item.name}</strong>
                      <p>{item.dose}</p>
                      <p>
                        {item.quantity && `Quantity: ${item.quantity} · `}
                        {item.refills} refills
                      </p>
                    </div>
                  ))}
                </div>
                {p.attachmentName && (
                  <a
                    className="text-button"
                    href={patientUrl(`/prescriptions/${p.id}/attachment`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View {p.attachmentName}
                  </a>
                )}
              </article>
            ))}
          {!query.isPending &&
            !query.isError &&
            !(query.data ?? []).some((p) => current(p) === active) && (
              <p className="muted">No {active ? 'current' : 'past'} prescriptions.</p>
            )}
        </section>
      ))}
      {adding && (
        <Modal open onClose={() => !busy && setAdding(false)} size="sm">
          <Modal.Header>
            <Modal.Title>Add prescription</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className="entry-form" onSubmit={submit}>
              <fieldset disabled={busy} className="entry-form" style={{ border: 0, padding: 0 }}>
                <label>
                  Prescriber
                  <Input name="prescriber" required maxLength={200} />
                </label>
                <div className="form-grid">
                  <label>
                    Date issued
                    <Input type="date" name="issuedOn" required />
                  </label>
                  <label>
                    Valid until <span className="optional">optional</span>
                    <Input type="date" name="validUntil" />
                  </label>
                </div>
                <label>
                  Rx / reference number <span className="optional">optional</span>
                  <Input name="reference" maxLength={200} />
                </label>
                <label>
                  Status
                  <select name="status">
                    <option>Current</option>
                    <option>Past</option>
                  </select>
                </label>
                {Array.from({ length: count }, (_, i) => (
                  <div className="entry-form dose-card" key={i}>
                    <h3>Prescribed medication {i + 1}</h3>
                    <label>
                      Name and strength
                      <Input name={`name${i}`} required maxLength={200} />
                    </label>
                    <label>
                      Dose / instructions
                      <Input name={`dose${i}`} required maxLength={500} />
                    </label>
                    <div className="form-grid">
                      <label>
                        Quantity
                        <Input name={`quantity${i}`} maxLength={100} />
                      </label>
                      <label>
                        Refills
                        <Input
                          name={`refills${i}`}
                          type="number"
                          min={0}
                          max={999}
                          defaultValue={0}
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-button"
                  disabled={count >= 50}
                  onClick={() => setCount((n) => n + 1)}
                >
                  + Add prescribed medication
                </button>
                <label>
                  Prescription image or document <span className="optional">optional</span>
                  <input
                    name="attachment"
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                  />
                  <small>JPG, PNG or PDF · up to 5 MB</small>
                </label>
              </fieldset>
              {error && <p role="alert">{error}</p>}
              <div className="form-actions">
                <Button disabled={busy} onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" appearance="primary" loading={busy}>
                  Save prescription
                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
