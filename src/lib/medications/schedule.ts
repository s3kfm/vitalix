import type { Medicine, DoseLog } from '../../types';
export const periods = ['Morning', 'Afternoon', 'Evening', 'Bedtime'] as const;
export function period(hour: number) { return hour < 12 ? 0 : hour < 17 ? 1 : hour < 21 ? 2 : 3; }
export function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isActive(m: Medicine, now = new Date()) {
  return m.active && (!m.endDate || m.endDate >= localDay(now));
}
function legacyDoseDay(dose: DoseLog) {
  const preserved = dose.notes.match(/(?:^|\n)Legacy skipped date\/time: ([^\n]+)/)?.[1];
  const timestamp = preserved?.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  return localDay(new Date(timestamp ?? dose.takenAt ?? dose.recordedAt));
}
export type Occurrence = { medicine: Medicine; time: string; scheduledFor: string; group: number; state: 'resolved' | 'overdue' | 'current' | 'upcoming'; log?: DoseLog };
/** Daily local wall-clock schedules follow the existing browser timezone convention. */
export function occurrences(medicines: Medicine[], doses: DoseLog[], now = new Date()): Occurrence[] {
  const result: Occurrence[] = [];
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const today = localDay(now);
  const records = new Map(doses.filter(d => d.scheduledFor).map(d => [`${d.medicineId}/${new Date(d.scheduledFor!).getTime()}`, d]));
  for (const medicine of medicines.filter(m => m.schedule.length)) {
    const start = medicine.startDate ? new Date(`${medicine.startDate}T00:00:00`) : new Date(medicine.createdAt);
    const day = new Date(start); day.setHours(0, 0, 0, 0);
    const end = medicine.endDate ? new Date(`${medicine.endDate}T23:59:59`) : now;
    // Stopped courses retain unresolved occurrences through their stop date.
    const stop = medicine.active ? end : new Date(Math.min(end.getTime(), new Date(medicine.updatedAt).getTime()));
    for (; day <= now && day <= stop; day.setDate(day.getDate() + 1)) {
      for (const time of medicine.schedule) {
        const [hour = 0, minute = 0] = time.split(':').map(Number);
        const when = new Date(day); when.setHours(hour, minute, 0, 0);
        // A wall-clock time skipped by a DST jump has no occurrence that day.
        if (when.getHours() !== hour || when.getMinutes() !== minute) continue;
        if (when < start || when > stop && !medicine.active) continue;
        const log = records.get(`${medicine.id}/${when.getTime()}`) ?? doses.find(d => !d.scheduledFor && d.medicineId === medicine.id && d.scheduledTime === time && legacyDoseDay(d) === localDay(when));
        if (localDay(day) !== today && log && localDay(new Date(log.recordedAt)) !== today) continue;
        const group = period(hour);
        const state = log ? 'resolved' : day.getTime() < todayStart.getTime() || group < period(now.getHours()) ? 'overdue' : group === period(now.getHours()) ? 'current' : 'upcoming';
        result.push({ medicine, time, scheduledFor: when.toISOString(), group, state, log });
      }
    }
  }
  return result.sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor));
}
