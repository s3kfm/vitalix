import { addDays, utcDay } from '../math/days';
import { NEW_CYCLE_GAP_DAYS } from './config';
import { isPeriodBleeding, observationsUpTo } from './evidence';
import type { Observation } from './types';

/**
 * Cycle start dates, replayed from the logged observations so edits and deletes are consistent.
 * A start is period bleeding after at least `NEW_CYCLE_GAP_DAYS` without any, or an explicit
 * "period started" mark. Spotting never starts a cycle, and a missing log is not evidence of
 * no bleeding.
 */
export function deriveCycleStarts(observations: Observation[], now: Date): Date[] {
  const starts: Date[] = [];
  let lastBleedingDay: number | undefined;
  const bleedingDays = observationsUpTo(observations, now).filter(
    (o) => isPeriodBleeding(o) || o.periodStarted,
  );
  for (const observation of bleedingDays) {
    const day = utcDay(observation.observedAt);
    const isAfterLongGap =
      lastBleedingDay === undefined || day - lastBleedingDay >= NEW_CYCLE_GAP_DAYS;
    const isNewlyMarkedStart =
      observation.periodStarted && !starts.some((start) => utcDay(start) === day);
    if (isAfterLongGap || isNewlyMarkedStart) starts.push(addDays(observation.observedAt, 0));
    lastBleedingDay = day;
  }
  return starts;
}
