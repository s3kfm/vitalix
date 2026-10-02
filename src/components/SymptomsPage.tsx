'use client';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeading } from './ui/PageHeading';
import { Tabs } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { SymptomLogModal } from './symptoms/SymptomLogModal';
import { SymptomRow } from './symptoms/SymptomRow';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Loader } from 'rsuite';
import type { SymptomRecord } from '../db/symptoms';
const viewOptions = ['All entries', 'Ongoing', 'Ended'] as const;
type View = (typeof viewOptions)[number];
export function SymptomsPage() {
  const symptoms = useQuery<SymptomRecord[]>({ queryKey: ['symptoms'] });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<View>('All entries');
  const [query, setQuery] = useState('');
  const entries = (symptoms.data ?? [])
    .filter(
      (s) =>
        (s.code.text ?? '').toLowerCase().includes(query.toLowerCase()) &&
        (tab === 'All entries' || (tab === 'Ongoing' ? !s.resolvedAt : !!s.resolvedAt)),
    )
    .sort((a, b) => b.onsetAt.localeCompare(a.onsetAt));
  return (
    <div className="page-stack">
      <PageHeading
        title="Symptoms"
        description="Make a little space for how you’re feeling."
        action={
          <Button appearance="primary" onClick={() => setOpen(true)}>
            <Plus size={17} />
            Log symptom
          </Button>
        }
      />
      <div className="soft-banner">
        <HeartNote />
        <div>
          <h3>Every detail has a place.</h3>
          <p>Record what you feel, when it happens, and anything you want to remember.</p>
        </div>
      </div>
      <section className="panel">
        <div className="panel-toolbar">
          <Tabs options={viewOptions} value={tab} onChange={setTab} />
          <label className="search-field">
            <Search size={16} />
            <Input
              aria-label="Search symptoms"
              placeholder="Search symptoms"
              value={query}
              onChange={setQuery}
            />
          </label>
        </div>
        {entries.map((s) => (
          <SymptomRow key={s.id} symptom={s} />
        ))}
        {symptoms.isPending && <Loader content="Loading symptoms…" />}
        {symptoms.isError && (
          <div role="alert">
            Could not load symptoms. <Button onClick={() => void symptoms.refetch()}>Retry</Button>
          </div>
        )}
        {symptoms.isSuccess && !entries.length && (
          <EmptyState
            title="Nothing here yet"
            description="Log a symptom, or try a different filter."
          />
        )}
      </section>
      {open && <SymptomLogModal onClose={() => setOpen(false)} />}
    </div>
  );
}
function HeartNote() {
  return <span className="banner-mark">♡</span>;
}
