'use client';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeading } from './ui/PageHeading';
import { Tabs } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { SymptomLogModal } from './symptoms/SymptomLogModal';
import { SymptomRow } from './symptoms/SymptomRow';
import { useHealthRecords } from '../context/HealthRecordsContext';
const viewOptions = ['All entries', 'Ongoing', 'Ended'] as const;
type View = (typeof viewOptions)[number];
export function SymptomsPage() {
  const { symptoms, resolveSymptom } = useHealthRecords();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<View>('All entries');
  const [query, setQuery] = useState('');
  const entries = symptoms.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) && (tab === 'All entries' || (tab === 'Ongoing' ? s.ongoing : !s.ongoing))).sort((a,b) => b.recordedAt.localeCompare(a.recordedAt));
  return <div className="page-stack"><PageHeading title="Symptoms" description="Make a little space for how you’re feeling." action={<button className="button" onClick={() => setOpen(true)}><Plus size={17}/>Log symptom</button>}/><div className="soft-banner"><HeartNote/><div><h3>Every detail has a place.</h3><p>Record what you feel, when it happens, and anything you want to remember.</p></div></div><section className="panel"><div className="panel-toolbar"><Tabs options={viewOptions} value={tab} onChange={setTab}/><label className="search-field"><Search size={16}/><input aria-label="Search symptoms" placeholder="Search symptoms" value={query} onChange={e => setQuery(e.target.value)}/></label></div>{entries.map(s => <SymptomRow key={s.id} symptom={s} onResolve={() => resolveSymptom(s.id)}/>)}{!entries.length && <EmptyState title="Nothing here yet" description="Log a symptom, or try a different filter."/>}</section>{open && <SymptomLogModal onClose={() => setOpen(false)}/>}</div>;
}
function HeartNote() { return <span className="banner-mark">♡</span>; }
