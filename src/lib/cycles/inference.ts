import type { cycleObservations, cycleStates, patientCycleProfiles } from '../../db/cycles';

export type Observation = Pick<
  typeof cycleObservations.$inferSelect,
  'id' | 'observedAt' | 'bleedingLevel' | 'cervicalMucus' | 'lhResult' | 'basalTemperatureCelsius'
> & { periodStarted?: boolean | null };
export type Profile = Omit<
  typeof patientCycleProfiles.$inferSelect,
  'patientId' | 'lastCalculatedAt' | 'preferences'
>;
export type State = Omit<typeof cycleStates.$inferInsert, 'id' | 'patientId' | 'cycleId'>;
const DAY = 86_400_000;
export const utcDay = (date: Date) => Math.floor(date.getTime() / DAY);
const plusDays = (date: Date, days: number) => new Date((utcDay(date) + days) * DAY);
const meaningful = (o: Observation) => ['light', 'medium', 'heavy'].includes(o.bleedingLevel ?? '');
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
};
const ordered = (observations: Observation[], now: Date) =>
  observations
    .filter((o) => o.observedAt <= now)
    .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime() || a.id.localeCompare(b.id));

/** Meaningful bleeding after at least 10 days without logged meaningful bleeding starts
 * a cycle. This intentionally simple segmentation is replayed after edits/deletes.
 * Spotting never starts a cycle; missing logs are not evidence of no bleeding. */
export function deriveCycleStarts(observations: Observation[], now: Date): Date[] {
  const starts: Date[] = [];
  let lastBleedingDay: number | undefined;
  for (const observation of ordered(observations, now).filter(
    (o) => meaningful(o) || o.periodStarted,
  )) {
    const day = utcDay(observation.observedAt);
    if (
      lastBleedingDay === undefined ||
      day - lastBleedingDay >= 10 ||
      (observation.periodStarted && !starts.some((start) => utcDay(start) === day))
    )
      starts.push(plusDays(observation.observedAt, 0));
    lastBleedingDay = day;
  }
  return starts;
}

export function learnProfile(
  starts: Date[],
  observations: Observation[],
  previous?: Profile | null,
): Profile {
  const lengths = starts
    .slice(1)
    .map((start, i) => utcDay(start) - utcDay(starts[i]!))
    .slice(-12);
  const typical = lengths.length ? median(lengths) : (previous?.typicalCycleLengthDays ?? 28);
  const min = lengths.length
    ? Math.min(...lengths, typical - (lengths.length < 3 ? 7 : 2))
    : (previous?.cycleLengthMinDays ?? 21);
  const max = lengths.length
    ? Math.max(...lengths, typical + (lengths.length < 3 ? 7 : 2))
    : (previous?.cycleLengthMaxDays ?? 35);
  // Learn period duration only when consecutive bleeding days have an explicit end signal.
  const periods: number[] = [];
  for (const start of starts.slice(0, -1)) {
    let duration = 0;
    for (let day = 0; day < 15; day++) {
      const entries = observations.filter((o) => utcDay(o.observedAt) === utcDay(start) + day);
      if (entries.some(meaningful)) duration++;
      else {
        if (
          duration &&
          entries.some((o) => o.bleedingLevel === 'none' || o.bleedingLevel === 'spotting')
        )
          periods.push(duration);
        break;
      }
    }
  }
  return {
    typicalCycleLengthDays: typical,
    typicalPeriodLengthDays: periods.length
      ? median(periods)
      : (previous?.typicalPeriodLengthDays ?? 5),
    cycleLengthMinDays: Math.max(1, min),
    cycleLengthMaxDays: max,
    irregularCycles:
      (previous?.irregularCycles ?? false) ||
      (lengths.length >= 2 && Math.max(...lengths) - Math.min(...lengths) > 7),
  };
}

export function predictCycle(start: Date, profile: Profile) {
  const next = plusDays(start, profile.typicalCycleLengthDays);
  return {
    predictedEndAt: next,
    predictedNextPeriodAt: next,
    predictedOvulationAt: plusDays(start, Math.max(1, profile.typicalCycleLengthDays - 14)),
  };
}

/** Conservative signal only: three consecutive daily temperatures >= 0.2 C above
 * all six preceding consecutive daily readings. Multiple readings on a day count once.
 * This does not medically confirm ovulation; v1 never emits `confirmed`. */
function temperatureRise(observations: Observation[]): Date | null {
  const days = new Map<number, Observation>();
  for (const o of observations)
    if (o.basalTemperatureCelsius !== null) days.set(utcDay(o.observedAt), o);
  const values = [...days.entries()].sort((a, b) => a[0] - b[0]);
  for (let i = values.length - 9; i >= 0; i--) {
    const window = values.slice(i, i + 9);
    if (window[8]![0] - window[0]![0] !== 8) continue;
    const baseline = Math.max(...window.slice(0, 6).map(([, o]) => o.basalTemperatureCelsius!));
    if (window.slice(6).every(([, o]) => o.basalTemperatureCelsius! >= baseline + 0.2 - 1e-9))
      return window[6]![1].observedAt;
  }
  return null;
}

export function calculateCycleState({
  observations,
  startedAt,
  profile,
  historyCount,
  now,
}: {
  observations: Observation[];
  startedAt: Date | null;
  profile: Profile;
  historyCount: number;
  now: Date;
}): State {
  const rows = ordered(observations, now).filter((o) => !startedAt || o.observedAt >= startedAt);
  const age = (o: Observation) => utcDay(now) - utcDay(o.observedAt);
  const latest = (field: 'lhResult' | 'cervicalMucus' | 'bleedingLevel') =>
    rows.filter((o) => o[field] !== null).at(-1);
  const lh = latest('lhResult');
  const mucus = latest('cervicalMucus');
  const bleeding = rows.filter((o) => o.bleedingLevel !== null || o.periodStarted).at(-1);
  const lhEvidence =
    lh && age(lh) <= 2 && ['positive', 'peak'].includes(lh.lhResult!)
      ? lh.lhResult === 'peak'
        ? 0.75
        : 0.65
      : 0;
  const mucusEvidence =
    mucus && age(mucus) <= 2 && ['watery', 'egg_white'].includes(mucus.cervicalMucus!) ? 0.55 : 0;
  const bleedingEvidence =
    bleeding && age(bleeding) <= 1 && (meaningful(bleeding) || bleeding.periodStarted) ? 0.9 : 0;
  const rise = temperatureRise(rows);
  const riseAge = rise ? utcDay(now) - utcDay(rise) : Infinity;
  const temperatureEvidence = riseAge <= 16 ? 0.8 : 0;
  const historyWeight =
    Math.min(0.6, 0.25 + historyCount * 0.07) * (profile.irregularCycles ? 0.5 : 1);
  const prediction = startedAt ? predictCycle(startedAt, profile) : null;
  const overdue = prediction
    ? Math.max(0, utcDay(now) - utcDay(prediction.predictedOvulationAt))
    : 0;
  const confidence = historyWeight * Math.exp(-overdue / 5);
  const uncertainty = profile.irregularCycles
    ? Math.max(7, Math.ceil((profile.cycleLengthMaxDays - profile.cycleLengthMinDays) / 2))
    : Math.max(2, Math.ceil((profile.cycleLengthMaxDays - profile.cycleLengthMinDays) / 4));
  const state: State = {
    calculatedAt: now,
    cycleDay: startedAt ? utcDay(now) - utcDay(startedAt) + 1 : null,
    phase: 'unknown',
    phaseConfidence: 0,
    ovulationStatus: prediction && overdue <= uncertainty ? 'predicted' : 'unknown',
    ovulationConfidence: prediction ? confidence : 0,
    predictedOvulationAt: prediction?.predictedOvulationAt ?? null,
    predictedNextPeriodAt: prediction?.predictedNextPeriodAt ?? null,
    fertileWindowStart: prediction
      ? plusDays(prediction.predictedOvulationAt, -5 - uncertainty)
      : null,
    fertileWindowEnd: prediction
      ? plusDays(prediction.predictedOvulationAt, 1 + uncertainty)
      : null,
    reasoning: {
      algorithmVersion: 'v1',
      cycleHistoryWeight: historyWeight,
      bleedingEvidence,
      lhEvidence,
      mucusEvidence,
      temperatureEvidence,
    },
  };
  if (bleedingEvidence) {
    state.phase = 'menstrual';
    state.phaseConfidence = bleedingEvidence;
    state.ovulationStatus = 'not_detected';
    state.ovulationConfidence = 0;
  } else if (temperatureEvidence) {
    state.phase = 'luteal';
    state.phaseConfidence = temperatureEvidence;
    state.ovulationStatus = 'likely';
    state.ovulationConfidence = Math.min(
      0.95,
      temperatureEvidence + lhEvidence * 0.1 + mucusEvidence * 0.1,
    );
  } else if (lhEvidence) {
    state.phase = 'ovulation_likely';
    state.phaseConfidence = Math.min(0.85, lhEvidence + mucusEvidence * 0.15);
    state.ovulationStatus = 'likely';
    state.ovulationConfidence = state.phaseConfidence;
  } else if (mucusEvidence) {
    state.phase = 'fertile';
    state.phaseConfidence = mucusEvidence;
    state.ovulationConfidence = Math.max(state.ovulationConfidence, 0.35);
  } else if (prediction && now < prediction.predictedOvulationAt) {
    state.phase = now >= state.fertileWindowStart! ? 'fertile' : 'follicular';
    state.phaseConfidence = confidence;
  }
  // Expose the evidence window separately from calendar estimates; no exact confirmed date.
  if (!bleedingEvidence && (temperatureEvidence || lhEvidence)) {
    const event = temperatureEvidence ? rise! : lh!.observedAt;
    const start = plusDays(event, temperatureEvidence ? -2 : 0);
    const end = plusDays(event, temperatureEvidence ? 0 : 2);
    state.reasoning.ovulationWindowStart = start.toISOString();
    state.reasoning.ovulationWindowEnd = end.toISOString();
    state.predictedOvulationAt = plusDays(start, 1);
    state.predictedNextPeriodAt = plusDays(start, 15);
    state.fertileWindowStart = plusDays(start, -5 - (profile.irregularCycles ? 2 : 0));
    state.fertileWindowEnd = plusDays(end, 1 + (profile.irregularCycles ? 2 : 0));
  }
  return state;
}
