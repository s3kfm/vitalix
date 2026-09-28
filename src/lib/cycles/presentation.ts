import type {
  cycleObservations,
  cycleStates,
  menstrualCycles,
  patientCycleProfiles,
} from '../../db/cycles';
type JsonDates<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};
export type CycleEntry = JsonDates<typeof cycleObservations.$inferSelect>;
export type CycleState = JsonDates<typeof cycleStates.$inferSelect>;
export type CycleOverview = {
  state: CycleState;
  profile: JsonDates<typeof patientCycleProfiles.$inferSelect> | null;
  observations: CycleEntry[];
  cycles: JsonDates<typeof menstrualCycles.$inferSelect>[];
};
export type DateRange = { start: string; end: string };
export const dayKey = (value: string | Date) => new Date(value).toISOString().slice(0, 10);
export const addDays = (value: string, days: number) =>
  new Date(new Date(`${dayKey(value)}T00:00:00Z`).getTime() + days * 86400000)
    .toISOString()
    .slice(0, 10);
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const confidenceLabel = (value: number) =>
  value >= 0.75 ? 'High' : value >= 0.4 ? 'Moderate' : 'Low';
export function formatDay(value: string, year = false) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(year ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  });
}
export function formatRange(range: DateRange | null) {
  if (!range) return 'Not enough information yet';
  const crossYear = range.start.slice(0, 4) !== range.end.slice(0, 4);
  return `${formatDay(range.start, crossYear)} – ${formatDay(range.end, crossYear)}`;
}
export function relativeDay(value: string, today: string) {
  const day = dayKey(value);
  return day === today
    ? 'Today'
    : day === addDays(today, -1)
      ? 'Yesterday'
      : formatDay(day, day.slice(0, 4) !== today.slice(0, 4));
}
export const inRange = (day: string, range: DateRange | null) =>
  !!range && day >= range.start && day <= range.end;
export function predictionRanges({ state, profile }: CycleOverview) {
  const confidence =
    state.ovulationStatus === 'not_detected'
      ? (state.reasoning.cycleHistoryWeight ?? 0.25)
      : state.ovulationConfidence;
  const extra = confidence < 0.2 ? 7 : confidence < 0.4 ? 4 : confidence < 0.75 ? 2 : 1;
  const typical = profile?.typicalCycleLengthDays ?? 28;
  const before = Math.max(extra, typical - (profile?.cycleLengthMinDays ?? 21));
  const after = Math.max(extra, (profile?.cycleLengthMaxDays ?? 35) - typical);
  const period = state.predictedNextPeriodAt
    ? {
        start: addDays(state.predictedNextPeriodAt, -before),
        end: addDays(state.predictedNextPeriodAt, after),
      }
    : null;
  const evidenceStart = state.reasoning.ovulationWindowStart;
  const evidenceEnd = state.reasoning.ovulationWindowEnd;
  const ovulation =
    evidenceStart && evidenceEnd
      ? { start: dayKey(evidenceStart), end: dayKey(evidenceEnd) }
      : state.predictedOvulationAt
        ? {
            start: addDays(
              state.predictedOvulationAt,
              -Math.max(extra, profile?.irregularCycles ? before : 2),
            ),
            end: addDays(
              state.predictedOvulationAt,
              Math.max(extra, profile?.irregularCycles ? after : 2),
            ),
          }
        : null;
  const fertile =
    state.fertileWindowStart && state.fertileWindowEnd
      ? {
          start: addDays(state.fertileWindowStart, -Math.max(0, extra - 2)),
          end: addDays(state.fertileWindowEnd, Math.max(0, extra - 2)),
        }
      : null;
  return { period, ovulation, fertile };
}
export function phaseLabel(state: CycleState) {
  if (state.phaseConfidence < 0.2) return 'Current phase uncertain';
  return {
    menstrual: 'Period',
    follicular: 'Between period and fertile window',
    fertile: state.phaseConfidence >= 0.4 ? 'Likely fertile window' : 'Possible fertile window',
    ovulation_likely: 'Likely ovulation',
    luteal: 'Likely after ovulation',
    unknown: 'Current phase uncertain',
  }[state.phase];
}
export function ovulationLabel(state: CycleState) {
  return state.ovulationStatus === 'confirmed'
    ? 'Confirmed ovulation'
    : state.ovulationStatus === 'likely'
      ? 'Likely ovulation'
      : state.ovulationStatus === 'predicted'
        ? 'Predicted ovulation'
        : 'Ovulation has not been confirmed';
}
export function observationLabels(entry: CycleEntry): string[] {
  return [
    entry.periodStarted ? 'Period started' : null,
    entry.bleedingLevel === 'none'
      ? 'No bleeding'
      : entry.bleedingLevel === 'spotting'
        ? 'Spotting'
        : entry.bleedingLevel
          ? `${entry.bleedingLevel[0]!.toUpperCase()}${entry.bleedingLevel.slice(1)} bleeding`
          : null,
    entry.cervicalMucus
      ? `${entry.cervicalMucus === 'egg_white' ? 'Egg-white' : entry.cervicalMucus[0]!.toUpperCase() + entry.cervicalMucus.slice(1)} cervical mucus`
      : null,
    entry.lhResult ? `${entry.lhResult[0]!.toUpperCase()}${entry.lhResult.slice(1)} LH test` : null,
    entry.basalTemperatureCelsius !== null
      ? `${entry.basalTemperatureCelsius.toFixed(2)} °C basal temperature`
      : null,
    ...(entry.symptoms ?? []),
  ].filter((item): item is string => !!item);
}
export function evidenceSummary(data: CycleOverview, today: string) {
  const { state } = data;
  const evidence: string[] = [];
  if (state.reasoning.cycleHistoryWeight)
    evidence.push(
      data.cycles.length > 1
        ? 'Recorded cycle history'
        : data.profile?.preferences?.typicalCycleLengthDays
          ? 'Your usual cycle length'
          : 'Conservative estimates while we learn your cycle',
    );
  const entries = data.observations
    .filter(
      (o) => (!state.cycleId || o.cycleId === state.cycleId) && o.observedAt <= state.calculatedAt,
    )
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt) || b.id.localeCompare(a.id));
  for (const [weight, field, suffix] of [
    ['bleedingEvidence', 'bleedingLevel', 'bleeding'],
    ['lhEvidence', 'lhResult', 'LH test'],
    ['mucusEvidence', 'cervicalMucus', 'cervical mucus'],
  ] as const) {
    if (!state.reasoning[weight]) continue;
    const entry = entries.find((o) => o[field] !== null);
    if (entry)
      evidence.push(
        `${entry[field]!.replace('egg_white', 'egg-white')} ${suffix} recorded ${relativeDay(entry.observedAt, today).toLowerCase()}`,
      );
  }
  if (state.reasoning.temperatureEvidence)
    evidence.push('A sustained rise across three daily temperature readings');
  return evidence;
}
export function predictionChange(before: CycleOverview, after: CycleOverview) {
  const oldRange = predictionRanges(before).fertile;
  const newRange = predictionRanges(after).fertile;
  if (oldRange && newRange) {
    const shift = daysBetween(oldRange.start, newRange.start);
    if (shift !== 0)
      return `Your estimated fertile window has shifted ${Math.abs(shift)} ${Math.abs(shift) === 1 ? 'day' : 'days'} ${shift > 0 ? 'later' : 'earlier'} based on your updated observations.`;
    if (oldRange.end !== newRange.end)
      return 'Your estimated fertile window has been adjusted based on your updated observations.';
  }
  return 'Your observations are saved. Predictions have been recalculated.';
}
