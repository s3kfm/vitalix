'use client';

import { Activity, HeartPulse, Pill, Stethoscope } from 'lucide-react';
import { formatDate } from '../ui/format';
import type { TimelineItem as TimelineItemType } from '../../../app/api/patients/[patientId]/timeline/route';

const kindMeta: Record<TimelineItemType['kind'], { icon: typeof Activity; label: string; tileClass?: string }> = {
  symptom: { icon: HeartPulse, label: 'Symptom', tileClass: 'peach' },
  dose: { icon: Pill, label: 'Dose' },
  measurement: { icon: Activity, label: 'Measurement' },
  medication: { icon: Stethoscope, label: 'Medication' },
};

export function TimelineItem({ item }: { item: TimelineItemType }) {
  const { icon: Icon, label, tileClass } = kindMeta[item.kind];

  return (
    <article className="activity-row">
      <span className={`icon-tile ${tileClass ?? ''}`}>
        <Icon size={18} />
      </span>
      <div className="row-main">
        <span className="activity-category">{label}</span>
        <h3>{item.title}</h3>
        <p>{item.detail}</p>
      </div>
      <time dateTime={item.timestamp}>{formatDate(item.timestamp)}</time>
    </article>
  );
}