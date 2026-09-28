'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button, Loader } from 'rsuite';
import { Plus, X } from 'lucide-react';
import { usePatient } from '@/src/context/PatientContext';
import { PageHeading } from '../ui/PageHeading';
import { CycleSummary } from './CycleSummary';
import { CycleCalendar } from './CycleCalendar';
import { CycleTimeline } from './CycleTimeline';
import { CycleSetup } from './CycleSetup';
import { ObservationSheet } from './ObservationSheet';
import {
  dayKey,
  predictionChange,
  type CycleEntry,
  type CycleOverview,
} from '@/src/lib/cycles/presentation';
import type { CreateCycleObservationInput, CycleSetupInput } from '@/src/lib/validations/cycles';
export function CyclesPage() {
  const { patient, patientUrl } = usePatient();
  const cache = useQueryClient();
  const queryKey = ['cycles', patient?.id];
  const query = useQuery<CycleOverview>({
    queryKey,
    queryFn: async ({ signal }) => (await axios.get(patientUrl('/cycles'), { signal })).data,
    enabled: !!patient,
    refetchInterval: 60_000,
  });
  const [sheet, setSheet] = useState<{ day: string; entry?: CycleEntry } | null>(null);
  const [setup, setSetup] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const today = dayKey(new Date());
  async function refresh(before?: CycleOverview) {
    await cache.cancelQueries({ queryKey });
    try {
      const updated: CycleOverview = (await axios.get(patientUrl('/cycles'))).data;
      cache.setQueryData(queryKey, updated);
      setNotice(
        before
          ? predictionChange(before, updated)
          : 'Your cycle tracking is ready. You can log as much or as little as you like.',
      );
    } catch {
      // The mutation already succeeded. Do not suggest retrying it and duplicating a log.
      setNotice(
        'Your entry was saved. We couldn’t refresh predictions yet. Please refresh the page.',
      );
      void cache.invalidateQueries({ queryKey });
    }
  }
  async function save(input: CreateCycleObservationInput, id?: string) {
    const before = query.data;
    try {
      if (id) await axios.patch(patientUrl(`/cycles/observations/${id}`), input);
      else await axios.post(patientUrl('/cycles/observations'), input);
    } catch (error) {
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || 'Could not save. Please try again.'
          : 'Could not save. Please try again.',
      );
    }
    await refresh(before);
  }
  async function remove(id: string) {
    const before = query.data;
    await axios.delete(patientUrl(`/cycles/observations/${id}`));
    await refresh(before);
  }
  async function saveSetup(input: CycleSetupInput) {
    await axios.post(patientUrl('/cycles/setup'), input);
    await refresh();
  }
  return (
    <div className="page-stack cycles-page">
      <PageHeading
        title="Cycle & ovulation"
        description="What’s happening now, and what might come next."
        action={
          <Button
            appearance="primary"
            onClick={() => setSheet({ day: today })}
            disabled={!query.data}
          >
            <Plus size={17} />
            Log today
          </Button>
        }
      />
      {query.isPending && (
        <div className="panel cycle-empty">
          <Loader content="Loading your cycle…" />
        </div>
      )}
      {query.isError && (
        <div className="panel cycle-empty" role="alert">
          <p>Could not load cycle tracking.</p>
          <Button onClick={() => void query.refetch()}>Try again</Button>
        </div>
      )}
      {query.data && (
        <>
          {!query.data.profile?.preferences && (
            <div className="cycle-welcome">
              <div>
                <h2>A little context goes a long way.</h2>
                <p>
                  Share your last period start and what’s usual for you. Not sure? You can just
                  start logging.
                </p>
              </div>
              <Button appearance="ghost" onClick={() => setSetup(true)}>
                Set up your cycle
              </Button>
            </div>
          )}
          {notice && (
            <div className="cycle-notice" role="status">
              <p>{notice}</p>
              <Button
                appearance="subtle"
                aria-label="Dismiss update"
                onClick={() => setNotice(null)}
              >
                <X size={16} />
              </Button>
            </div>
          )}
          <CycleSummary data={query.data} today={today} />
          <div className="cycle-columns">
            <CycleCalendar
              data={query.data}
              today={today}
              selected={selected}
              onSelect={setSelected}
            />
            <CycleTimeline
              data={query.data}
              today={today}
              selected={selected}
              onClear={() => setSelected(null)}
              onEdit={(entry) => setSheet({ day: dayKey(entry.observedAt), entry })}
              onLog={(day) => setSheet({ day })}
            />
          </div>
          <p className="cycle-footnote">
            Your observations are the record. Predictions are a guide and can change.
          </p>
        </>
      )}
      {sheet && (
        <ObservationSheet
          entry={sheet.entry}
          day={sheet.day}
          onClose={() => setSheet(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
      {setup && <CycleSetup onClose={() => setSetup(false)} onSave={saveSetup} />}
    </div>
  );
}
