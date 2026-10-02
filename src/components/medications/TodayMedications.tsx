'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Pill, Check, Plus } from 'lucide-react';
import { Loader } from 'rsuite';
import { usePatient } from '@/src/context/PatientContext';
import type { DoseLog, Medicine } from '../../types';
import { DoseLogModal } from './DoseLogModal';
import { EmptyState } from '../ui/EmptyState';
import { timeLabel } from '../ui/format';
import {
  isActive,
  localDay,
  occurrences,
  periods,
  period,
  type Occurrence,
} from '../../lib/medications/schedule';
export function TodayMedications() {
  const { patientUrl } = usePatient();
  const client = useQueryClient();
  const medicationsQuery = useQuery<Medicine[]>({ queryKey: ['medications'] });
  const dosesQuery = useQuery<DoseLog[]>({ queryKey: ['doses'] });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [selected, setSelected] = useState<{ medicine?: Medicine; log?: DoseLog } | null>(null);
  const mutation = useMutation({
    mutationFn: async ({
      occurrence: o,
      status,
      undo,
    }: {
      occurrence: Occurrence;
      status?: 'Taken' | 'Skipped';
      undo?: boolean;
    }) => {
      if (undo && o.log) return axios.delete(patientUrl(`/doses/${o.log.id}`));
      return axios.post(patientUrl('/doses'), {
        medicineId: o.medicine.id,
        dose: o.medicine.dose,
        status,
        scheduledFor: o.scheduledFor,
        scheduledTime: o.time,
        takenAt: status === 'Taken' ? new Date().toISOString() : null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    },
    onSettled: async () => {
      await Promise.all(
        ['doses', 'timeline'].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
    },
  });
  if (medicationsQuery.isPending || dosesQuery.isPending)
    return <Loader content="Loading your routine…" />;
  if (medicationsQuery.isError || dosesQuery.isError)
    return (
      <p role="alert">
        Could not load your routine.{' '}
        <button
          className="text-button"
          onClick={() => {
            void medicationsQuery.refetch();
            void dosesQuery.refetch();
          }}
        >
          Retry
        </button>
      </p>
    );
  const medicines = medicationsQuery.data ?? [];
  const items = occurrences(medicines, dosesQuery.data ?? [], now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const isOverdueSection = (o: Occurrence) =>
    o.state === 'overdue' || Date.parse(o.scheduledFor) < todayStart.getTime();
  const overdue = items.filter(isOverdueSection);
  const prn = medicines.filter(
    (m) => isActive(m, now) && !m.schedule.length && (!m.startDate || m.startDate <= localDay(now)),
  );
  function card(o: Occurrence, compact = false) {
    return (
      <article
        className={`dose-card ${compact ? 'compact' : ''} ${o.log ? 'resolved' : ''}`}
        key={`${o.medicine.id}/${o.scheduledFor}`}
      >
        <div className="dose-main">
          <span className="icon-tile">
            <Pill size={19} />
          </span>
          <div className="dose-copy">
            <strong>
              {o.medicine.name} {o.medicine.strength}
            </strong>
            <p>
              {o.medicine.dose}
              {o.medicine.notes ? ` · ${o.medicine.notes}` : ''}
            </p>
          </div>
          <span className={`dose-clock ${o.state === 'overdue' ? 'overdue' : ''}`}>
            {o.state === 'overdue' && (
              <>
                {new Date(o.scheduledFor).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                ·{' '}
              </>
            )}
            {timeLabel(o.time)}
          </span>
        </div>
        {!compact && (
          <div className="dose-actions">
            {o.log ? (
              <>
                <span className="dose-result">
                  <Check size={14} />
                  {o.log.status === 'Taken'
                    ? `Taken at ${new Date(o.log.takenAt!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    : 'Skipped'}
                </span>
                <button
                  className="text-button"
                  disabled={mutation.isPending}
                  onClick={() => setSelected({ medicine: o.medicine, log: o.log })}
                >
                  Edit
                </button>
                <button
                  className="text-button"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ occurrence: o, undo: true })}
                >
                  Undo
                </button>
              </>
            ) : (
              <>
                <button
                  className="button secondary small"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ occurrence: o, status: 'Skipped' })}
                >
                  Skip
                </button>
                <button
                  className="button small"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ occurrence: o, status: 'Taken' })}
                >
                  <Check size={13} />
                  Taken
                </button>
              </>
            )}
          </div>
        )}
      </article>
    );
  }
  return (
    <div className="med-routine">
      {mutation.isError && (
        <p role="alert">
          {axios.isAxiosError(mutation.error)
            ? (mutation.error.response?.data?.error ?? 'Could not update dose. Try again.')
            : 'Could not update dose.'}
        </p>
      )}
      {!!overdue.length && (
        <section className="med-group">
          <div className="med-group-heading">
            <h2>Overdue / unresolved</h2>
            <span>{overdue.filter((o) => !o.log).length} remaining</span>
          </div>
          {overdue.map((o) => card(o))}
        </section>
      )}
      {periods
        .map((label, group) => ({ label, group }))
        .sort(
          (a, b) =>
            ((a.group - period(now.getHours()) + 4) % 4) -
            ((b.group - period(now.getHours()) + 4) % 4),
        )
        .map(({ label, group }) => {
          const rows = items.filter((o) => o.group === group && !isOverdueSection(o));
          if (!rows.length) return null;
          const upcoming = group > period(now.getHours());
          return (
            <section key={label} className={`med-group ${upcoming ? 'upcoming' : ''}`}>
              <div className="med-group-heading">
                <h2>
                  {upcoming
                    ? 'Upcoming'
                    : group === period(now.getHours())
                      ? 'Current'
                      : 'Earlier today'}{' '}
                  · {label}
                </h2>
                <span>{rows.filter((o) => !o.log).length} remaining</span>
              </div>
              <div className={upcoming ? 'upcoming-list' : 'med-group'}>
                {rows.map((o) => card(o, upcoming && !o.log))}
              </div>
            </section>
          );
        })}
      {!items.length && (
        <EmptyState
          title="No scheduled doses today"
          description="Your daily routine will appear here when you add a scheduled medication."
        />
      )}
      {!!prn.length && (
        <section className="med-group">
          <div className="med-group-heading prn-heading">
            <div>
              <h2>As needed (PRN)</h2>
              <p>Take only when symptoms occur</p>
            </div>
            <span>{prn.length} available</span>
          </div>
          {prn.map((m) => (
            <article className="dose-card" key={m.id}>
              <div className="dose-main">
                <span className="icon-tile">
                  <Plus size={18} />
                </span>
                <div className="dose-copy">
                  <strong>
                    {m.name} {m.strength}
                  </strong>
                  <p>
                    {m.dose}
                    {m.notes ? ` · ${m.notes}` : ''}
                  </p>
                </div>
                <button
                  className="button secondary small"
                  onClick={() => setSelected({ medicine: m })}
                >
                  Log dose
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      <button className="one-off-button" onClick={() => setSelected({})}>
        <Plus size={15} />
        Record one-off or unlisted medicine
      </button>
      {selected && <DoseLogModal {...selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
