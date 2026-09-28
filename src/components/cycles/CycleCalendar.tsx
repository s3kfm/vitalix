'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from 'rsuite';
import {
  addDays,
  dayKey,
  formatDay,
  inRange,
  observationLabels,
  predictionRanges,
  type CycleOverview,
} from '@/src/lib/cycles/presentation';
export function CycleCalendar({
  data,
  today,
  selected,
  onSelect,
}: {
  data: CycleOverview;
  today: string;
  selected: string | null;
  onSelect: (day: string) => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const first = `${month}-01`;
  const offset = new Date(`${first}T00:00:00Z`).getUTCDay();
  const count = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
  ).getUTCDate();
  const ranges = predictionRanges(data);
  const move = (direction: number) =>
    setMonth(
      new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + direction, 1))
        .toISOString()
        .slice(0, 7),
    );
  return (
    <section className="panel cycle-calendar" aria-label="Cycle calendar">
      <div className="panel-title">
        <h2>
          {new Date(first).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </h2>
        <div className="row-actions">
          <Button
            appearance="subtle"
            onClick={() => {
              setMonth(today.slice(0, 7));
              onSelect(today);
            }}
          >
            Today
          </Button>
          <Button appearance="subtle" aria-label="Previous month" onClick={() => move(-1)}>
            <ChevronLeft size={17} />
          </Button>
          <Button appearance="subtle" aria-label="Next month" onClick={() => move(1)}>
            <ChevronRight size={17} />
          </Button>
        </div>
      </div>
      <div className="cycle-calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span className="cycle-weekday" key={d}>
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const day = addDays(first, i);
          const entries = data.observations.filter((o) => dayKey(o.observedAt) === day);
          const bleeding = entries.some(
            (o) => o.periodStarted || (o.bleedingLevel && o.bleedingLevel !== 'none'),
          );
          const period = inRange(
            day,
            ranges.period
              ? {
                  ...ranges.period,
                  end: addDays(ranges.period.end, (data.profile?.typicalPeriodLengthDays ?? 5) - 1),
                }
              : null,
          );
          const fertile = inRange(day, ranges.fertile);
          const ovulation = inRange(day, ranges.ovulation);
          const likely = ovulation && data.state.ovulationStatus === 'likely';
          const confirmed = ovulation && data.state.ovulationStatus === 'confirmed';
          const descriptions = [
            bleeding ? 'Recorded bleeding' : '',
            period ? 'Predicted period days' : '',
            fertile ? 'Predicted fertile window' : '',
            ovulation
              ? confirmed
                ? 'Confirmed ovulation window'
                : likely
                  ? 'Likely ovulation window'
                  : 'Estimated ovulation'
              : '',
            ...entries.flatMap(observationLabels),
          ].filter(Boolean);
          return (
            <button
              key={day}
              type="button"
              className={`cycle-calendar-day ${fertile ? 'is-fertile' : ''} ${period ? 'is-predicted-period' : ''} ${day === today ? 'is-today' : ''} ${selected === day ? 'is-selected' : ''}`}
              aria-pressed={selected === day}
              aria-current={day === today ? 'date' : undefined}
              aria-label={`${formatDay(day, true)}${descriptions.length ? ': ' + descriptions.join(', ') : ': No observations'}`}
              onClick={() => onSelect(day)}
            >
              <span>{i + 1}</span>
              <span className="cycle-day-marks" aria-hidden="true">
                {bleeding && <i className="cycle-mark recorded" />}
                {entries.length > 0 && !bleeding && <i className="cycle-mark entry" />}
                {ovulation && (
                  <i
                    className={`cycle-mark ${confirmed ? 'confirmed' : likely ? 'likely' : 'estimated'}`}
                  >
                    {confirmed ? '✓' : likely ? '≈' : ''}
                  </i>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="cycle-calendar-legend">
        <span>
          <i className="cycle-mark recorded" />
          Recorded bleeding
        </span>
        <span>
          <i className="cycle-mark entry" />
          Other observation
        </span>
        <span>
          <i className="cycle-key period" />
          Predicted period
        </span>
        <span>
          <i className="cycle-key fertile" />
          Predicted fertile window
        </span>
        <span>
          <i className="cycle-mark estimated" />
          Estimated ovulation
        </span>
        <span>
          <i className="cycle-mark likely">≈</i>Likely ovulation
        </span>
        {data.state.ovulationStatus === 'confirmed' && (
          <span>
            <i className="cycle-mark confirmed">✓</i>Confirmed ovulation
          </span>
        )}
      </div>
      <p className="cycle-calendar-note">
        Predictions are ranges, not recorded events. Select a day to see its observations. Calendar
        days use UTC.
      </p>
    </section>
  );
}
