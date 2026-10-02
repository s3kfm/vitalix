'use client';
import { useState } from 'react';
import { Plus, Pill } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'rsuite';
import { PageHeading } from './ui/PageHeading';
import { Tabs } from './ui/Tabs';
import { timeLabel } from './ui/format';
import { TodayMedications } from './medications/TodayMedications';
import { AddMedicineModal } from './medications/AddMedicineModal';
import { Prescriptions } from './medications/Prescriptions';
import { isActive } from '../lib/medications/schedule';
import type { Medicine } from '../types';
const views = ['Today', 'My medications', 'Prescriptions'] as const;
export function MedicationsPage() {
  const query = useQuery<Medicine[]>({ queryKey: ['medications'] });
  const [tab, setTab] = useState<(typeof views)[number]>('Today');
  const [editing, setEditing] = useState<{ medicine?: Medicine } | null>(null);
  const medicines = query.data ?? [];
  const groups = [
    { title: 'Active scheduled', items: medicines.filter((m) => isActive(m) && m.schedule.length) },
    { title: 'As needed (PRN)', items: medicines.filter((m) => isActive(m) && !m.schedule.length) },
    { title: 'Past medications', items: medicines.filter((m) => !isActive(m)) },
  ];
  const date = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  return (
    <div className="page-stack medications-page">
      <PageHeading
        title="Medications"
        description="Your routine, one dose at a time."
        action={
          <button className="button" onClick={() => setEditing({})}>
            <Plus size={16} />
            Add medication
          </button>
        }
      />
      <Tabs options={views} value={tab} onChange={setTab} />
      {tab === 'Today' && <TodayMedications />}
      {tab === 'My medications' && (
        <div className="med-routine">
          {query.isPending && <Loader content="Loading medications…" />}
          {query.isError && (
            <p role="alert">
              Could not load medications.{' '}
              <button className="text-button" onClick={() => void query.refetch()}>
                Retry
              </button>
            </p>
          )}
          {groups.map(({ title, items }) => (
            <section className="med-group" key={title}>
              <div className="med-group-heading">
                <h2>{title}</h2>
                <span>{items.length}</span>
              </div>
              {!items.length && <p className="muted">No {title.toLowerCase()}.</p>}
              {items.map((m) => (
                <article className={`dose-card ${!isActive(m) ? 'resolved' : ''}`} key={m.id}>
                  <div className="dose-main">
                    <span className="icon-tile">
                      <Pill size={18} />
                    </span>
                    <div className="dose-copy">
                      <strong>
                        {m.name} {m.strength}
                      </strong>
                      <p>{m.dose}</p>
                      <p>
                        {m.schedule.length
                          ? `${m.schedule.length === 1 ? 'Every day' : m.schedule.length === 2 ? 'Twice daily' : `${m.schedule.length} times daily`} · ${m.schedule.map(timeLabel).join(' & ')}`
                          : m.notes || 'As needed'}
                      </p>
                      {m.endDate ? (
                        <p>Until {date(m.endDate)}</p>
                      ) : m.startDate ? (
                        <p>Taking since {date(m.startDate)}</p>
                      ) : null}
                      {!isActive(m) && (
                        <span className="badge neutral">
                          {m.endedReason ?? (m.endDate ? 'Completed' : 'Discontinued')}
                        </span>
                      )}
                    </div>
                    <button className="text-button" onClick={() => setEditing({ medicine: m })}>
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
      {tab === 'Prescriptions' && <Prescriptions />}
      {editing && <AddMedicineModal medicine={editing.medicine} onClose={() => setEditing(null)} />}
    </div>
  );
}
