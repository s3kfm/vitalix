import { Button } from 'rsuite';
import { Pencil, Plus } from 'lucide-react';
import {
  dayKey,
  formatDay,
  observationLabels,
  relativeDay,
  type CycleEntry,
  type CycleOverview,
} from '@/src/lib/cycles/presentation';
export function CycleTimeline({
  data,
  today,
  selected,
  onClear,
  onEdit,
  onLog,
}: {
  data: CycleOverview;
  today: string;
  selected: string | null;
  onClear: () => void;
  onEdit: (entry: CycleEntry) => void;
  onLog: (day: string) => void;
}) {
  const entries = [...data.observations]
    .filter((o) => !selected || dayKey(o.observedAt) === selected)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt) || b.id.localeCompare(a.id));
  const days = [...new Set(entries.map((o) => dayKey(o.observedAt)))];
  return (
    <section className="panel cycle-timeline" aria-label="Cycle observations">
      <div className="panel-title">
        <div>
          <h2>{selected ? relativeDay(selected, today) : 'Recent observations'}</h2>
          <p>Recorded by you</p>
        </div>
        {selected && (
          <Button appearance="subtle" onClick={onClear}>
            Show all
          </Button>
        )}
      </div>
      {!entries.length && (
        <div className="cycle-empty">
          <p>
            {selected
              ? `No observations for ${formatDay(selected)}.`
              : 'Your observations will appear here.'}
          </p>
          <p className="muted">A single detail is a good place to start.</p>
        </div>
      )}
      {days.map((day) => (
        <div className="cycle-timeline-day" key={day}>
          {!selected && (
            <h3>
              <time dateTime={day}>{relativeDay(day, today)}</time>
            </h3>
          )}
          {entries
            .filter((o) => dayKey(o.observedAt) === day)
            .map((entry) => {
              const labels = observationLabels(entry);
              const isStart =
                data.cycles.some((c) => c.id === entry.cycleId && dayKey(c.startedAt) === day) &&
                !entry.periodStarted &&
                ['light', 'medium', 'heavy'].includes(entry.bleedingLevel ?? '');
              return (
                <article className="cycle-timeline-entry" key={entry.id}>
                  <span className="cycle-timeline-dot" aria-hidden="true" />
                  <div>
                    {isStart && (
                      <span className="cycle-small-label">Period start inferred from bleeding</span>
                    )}
                    <p>{labels.length ? labels.join(' · ') : 'Observation'}</p>
                    {entry.notes && <p className="cycle-entry-notes">{entry.notes}</p>}
                    <small className="muted">Recorded</small>
                  </div>
                  <Button
                    appearance="subtle"
                    aria-label={`Edit observation for ${formatDay(day)}`}
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil size={15} />
                  </Button>
                </article>
              );
            })}
        </div>
      ))}
      {(!selected || selected <= today) && (
        <div className="cycle-timeline-footer">
          <Button appearance="subtle" onClick={() => onLog(selected ?? today)}>
            <Plus size={15} />
            {selected && selected !== today ? 'Log for this day' : 'Log today'}
          </Button>
        </div>
      )}
    </section>
  );
}
