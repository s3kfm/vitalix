'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Loader } from 'rsuite';
import type { DoseLog } from '../../types';
import { MedicineRow } from './MedicineRow';
import { DoseLogModal } from './DoseLogModal';
import { EmptyState } from '../ui/EmptyState';
import type { Medicine } from '../../types';
export function TodayMedications() {
  const medicationsQuery = useQuery<Medicine[]>({ queryKey: ['medications'] });
  const dosesQuery = useQuery<DoseLog[]>({ queryKey: ['doses'] });
  const medicines = medicationsQuery.data ?? [];
  const doses = dosesQuery.data ?? [];
  const [selected, setSelected] = useState<{ medicine: Medicine; time?: string } | null>(null);
  const active = medicines.filter(m => m.active);
  const scheduled = active.flatMap(medicine => medicine.schedule.map(time => ({ medicine, time }))).sort((a,b) => a.time.localeCompare(b.time));
  if (medicationsQuery.isPending || dosesQuery.isPending) return <Loader content="Loading medications…"/>;
  if (medicationsQuery.isError || dosesQuery.isError) return <p role="alert">Could not load your routine. <Button onClick={() => { void medicationsQuery.refetch(); void dosesQuery.refetch(); }}>Retry</Button></p>;
  return <>{!active.length && <EmptyState title="Your routine starts here" description="Add a medication to start recording doses."/>}{scheduled.map(({ medicine, time }) => <MedicineRow key={`${medicine.id}-${time}`} medicine={medicine} time={time} log={doses.find(d => d.medicineId === medicine.id && d.scheduledTime === time && new Date(d.takenAt).toDateString() === new Date().toDateString())} onLog={() => setSelected({ medicine, time })}/>)}{active.some(m => !m.schedule.length) && <p className="section-label">AS NEEDED</p>}{active.filter(m => !m.schedule.length).map(medicine => <MedicineRow key={medicine.id} medicine={medicine} onLog={() => setSelected({ medicine })}/>)}{selected && <DoseLogModal medicine={selected.medicine} scheduledTime={selected.time} onClose={() => setSelected(null)}/>}</>;
}
