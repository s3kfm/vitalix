import { groupBy } from 'es-toolkit';
import { addDays, daysBetween, utcDay } from '../math/days';
import { roundedMedian } from '../math/stats';
import { DEFAULT_CYCLE, LUTEAL_PHASE_DAYS, PROFILE_LEARNING } from './config';
import { isPeriodBleeding } from './evidence';
import type { Observation, Profile } from './types';

/** Days between consecutive cycle starts, most recent cycles only. */
function cycleLengths(starts: Date[]) {
  return starts
    .slice(1)
    .map((start, i) => daysBetween(starts[i]!, start))
    .slice(-PROFILE_LEARNING.recentCyclesUsed);
}

/**
 * Period lengths, counting consecutive bleeding days after each start. A period only counts when
 * a "none" or "spotting" entry marks its end; a missing log could mean anything.
 */
function periodLengths(starts: Date[], observations: Observation[]) {
  const byDay = groupBy(observations, (o) => utcDay(o.observedAt));
  const lengths: number[] = [];
  for (const start of starts.slice(0, -1)) {
    let bleedingDays = 0;
    for (let offset = 0; offset < PROFILE_LEARNING.maxPeriodScanDays; offset++) {
      const entries = byDay[utcDay(start) + offset] ?? [];
      if (entries.some(isPeriodBleeding)) {
        bleedingDays++;
        continue;
      }
      const markedAsEnded = entries.some(
        (o) => o.bleedingLevel === 'none' || o.bleedingLevel === 'spotting',
      );
      if (bleedingDays && markedAsEnded) lengths.push(bleedingDays);
      break;
    }
  }
  return lengths;
}

/** Cycle length range around `typical`, widened when there is little data to trust. */
function cycleLengthRange(lengths: number[], typical: number) {
  const { fewCyclesBelow, rangePaddingFewCycles, rangePaddingManyCycles } = PROFILE_LEARNING;
  const padding = lengths.length < fewCyclesBelow ? rangePaddingFewCycles : rangePaddingManyCycles;
  return {
    min: Math.min(...lengths, typical - padding),
    max: Math.max(...lengths, typical + padding),
  };
}

/** Learns typical cycle and period lengths from history, falling back to `previous`, then defaults. */
export function learnProfile(
  starts: Date[],
  observations: Observation[],
  previous?: Profile | null,
): Profile {
  const lengths = cycleLengths(starts);
  const hasHistory = lengths.length > 0;
  const typical = hasHistory
    ? roundedMedian(lengths)
    : (previous?.typicalCycleLengthDays ?? DEFAULT_CYCLE.lengthDays);
  const range = hasHistory ? cycleLengthRange(lengths, typical) : undefined;
  const periods = periodLengths(starts, observations);
  const spread = hasHistory ? Math.max(...lengths) - Math.min(...lengths) : 0;

  return {
    typicalCycleLengthDays: typical,
    typicalPeriodLengthDays: periods.length
      ? roundedMedian(periods)
      : (previous?.typicalPeriodLengthDays ?? DEFAULT_CYCLE.periodLengthDays),
    cycleLengthMinDays: Math.max(
      1,
      range ? range.min : (previous?.cycleLengthMinDays ?? DEFAULT_CYCLE.lengthMinDays),
    ),
    cycleLengthMaxDays: range
      ? range.max
      : (previous?.cycleLengthMaxDays ?? DEFAULT_CYCLE.lengthMaxDays),
    irregularCycles:
      (previous?.irregularCycles ?? false) ||
      (lengths.length >= 2 && spread > PROFILE_LEARNING.irregularSpreadDays),
  };
}

/** Calendar-based dates for a cycle that began on `start`. */
export function predictCycle(start: Date, profile: Profile) {
  const next = addDays(start, profile.typicalCycleLengthDays);
  return {
    predictedEndAt: next,
    predictedNextPeriodAt: next,
    predictedOvulationAt: addDays(
      start,
      Math.max(1, profile.typicalCycleLengthDays - LUTEAL_PHASE_DAYS),
    ),
  };
}
