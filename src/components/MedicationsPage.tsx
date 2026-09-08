'use client';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Loader } from 'rsuite';
import type { DoseLog } from '../types';
import { PageHeading } from './ui/PageHeading';
import { Tabs } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { formatDate, timeLabel } from './ui/format';
import { TotalActiveMedicationsCard } from './medications/TotalActiveMedicationsCard';
import { NextDoseCard } from './medications/NextDoseCard';
import { TodayMedications } from './medications/TodayMedications';
import { AddMedicineModal } from './medications/AddMedicineModal';
import { DoseLogModal } from './medications/DoseLogModal';
import type { Medicine } from '../types';
const viewOptions = ['Today', 'My medications', 'History'] as const;
type View = (typeof viewOptions)[number];
export function MedicationsPage() {
  const medicationsQuery = useQuery<Medicine[]>({ queryKey: ['medications'] });
  const dosesQuery = useQuery<DoseLog[]>({ queryKey: ['doses'] });
  const medicines = medicationsQuery.data ?? [];
  const doses = dosesQuery.data ?? [];
  const queryClient = useQueryClient();
  const archive = useMutation({
    mutationFn: (medicine: Medicine) => axios.patch('/api/medications/' + medicine.id, { active: !medicine.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medications'] }),
  });
  const [tab, setTab] = useState<View>('Today');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Medicine | null>(null);
  const filtered = medicines.filter(m => `${m.name} ${m.strength}`.toLowerCase().includes(search.toLowerCase()));
  const history = doses.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).sort((a,b) => b.takenAt.localeCompare(a.takenAt));
  return <div className="page-stack"><PageHeading title="Medications" description="Your routine, one dose at a time." action={<button className="button" onClick={() => setAdding(true)}><Plus size={17}/>Add medication</button>}/>{(medicationsQuery.isPending || dosesQuery.isPending) && <Loader content="Loading medications…"/>}{(medicationsQuery.isError || dosesQuery.isError) && <p role="alert">Could not load medication records. <Button onClick={() => { void medicationsQuery.refetch(); void dosesQuery.refetch(); }}>Retry</Button></p>}{archive.isError && <p role="alert">Could not update medication. Please try again.</p>}<div className="summary-grid"><TotalActiveMedicationsCard medicines={medicines}/><NextDoseCard medicines={medicines} doses={doses}/><div className="summary-card"><p>Doses recorded today</p><strong>{doses.filter(d => d.status === 'Taken' && new Date(d.takenAt).toDateString() === new Date().toDateString()).length}</strong><small>A record of what you’ve taken</small></div></div><section className="panel"><div className="panel-toolbar"><Tabs options={viewOptions} value={tab} onChange={setTab}/>{tab !== 'Today' && <label className="search-field"><Search size={16}/><input aria-label="Search medications" placeholder="Search medications" value={search} onChange={e => setSearch(e.target.value)}/></label>}</div>{tab === 'Today' && <TodayMedications/>}{tab === 'My medications' && <div className="table-scroll"><table><thead><tr><th>Medication</th><th>Usual dose</th><th>Schedule</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map(m => <tr key={m.id}><td><strong>{m.name}</strong><small>{m.strength}</small></td><td>{m.dose}</td><td>{m.schedule.length ? [...m.schedule].sort().map(timeLabel).join(', ') : 'As needed'}</td><td><span className={m.active ? 'badge' : 'badge neutral'}>{m.active ? 'Active' : 'Archived'}</span></td><td><div className="row-actions">{m.active && <button className="text-button" onClick={() => setSelected(m)}>Log dose</button>}<button className="text-button" disabled={archive.isPending} onClick={() => archive.mutate(m)}>{m.active ? 'Archive' : 'Restore'}</button></div></td></tr>)}</tbody></table>{!filtered.length && <EmptyState title="No medications found" description="Try another search or add a medication."/>}</div>}{tab === 'History' && (history.length ? <div className="table-scroll"><table><thead><tr><th>Medication</th><th>Dose</th><th>Date & time</th><th>Status</th><th>Notes</th></tr></thead><tbody>{history.map(d => <tr key={d.id}><td><strong>{d.name}</strong></td><td>{d.dose}</td><td>{formatDate(d.takenAt)}</td><td><span className="badge">{d.status}</span></td><td>{d.notes || '—'}</td></tr>)}</tbody></table></div> : <EmptyState title="A clearer picture of your routine" description="Recorded doses will appear here. Start with Log dose in Today."/>)}</section>{adding && <AddMedicineModal onClose={() => setAdding(false)}/ >}{selected && <DoseLogModal medicine={selected} onClose={() => setSelected(null)}/>}</div>;
}
