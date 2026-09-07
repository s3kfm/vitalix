'use client';
import { useState } from 'react';
import { Activity, HeartPulse, Pill, FileText, Search } from 'lucide-react';
import { useHealthRecords } from '../../context/HealthRecordsContext';
import { Tabs } from '../ui/Tabs';
import { EmptyState } from '../ui/EmptyState';
import { formatDate } from '../ui/format';
const icons = { Measurements: Activity, Symptoms: HeartPulse, Medications: Pill, Reports: FileText };
const viewOptions = ['All', 'Measurements', 'Symptoms', 'Medications', 'Reports'] as const;
type View = (typeof viewOptions)[number];
export function ActivityFeed() {
  const { activity } = useHealthRecords();
  const [filter, setFilter] = useState<View>('All');
  const [query, setQuery] = useState('');
  const entries = activity.filter(a => (filter === 'All' || a.category === filter) && `${a.title} ${a.detail}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => b.recordedAt.localeCompare(a.recordedAt));
  return <section className="panel"><div className="panel-title"><div><h2>Your health timeline</h2><p>Small updates. A more complete picture.</p></div><label className="search-field"><Search size={16}/><input aria-label="Search timeline" placeholder="Search your records" value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className="feed-tabs"><Tabs options={viewOptions} value={filter} onChange={setFilter}/></div><div>{entries.map(a => { const Icon = icons[a.category]; return <article className="activity-row" key={a.id}><span className={`icon-tile ${a.category === 'Symptoms' ? 'peach' : ''}`}><Icon size={18}/></span><div className="row-main"><span className="activity-category">{a.category}</span><h3>{a.title}</h3><p>{a.detail}</p></div><time dateTime={a.recordedAt}>{formatDate(a.recordedAt)}</time></article>; })}{!entries.length && <EmptyState title="No entries here yet" description="Your recorded health updates will appear here."/>}</div></section>;
}
