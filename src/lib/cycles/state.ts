import { clamp } from 'es-toolkit';
import { addDays, daysBetween } from '../math/days';
import { decayFactor, weightedSum } from '../math/stats';
import {
  EVIDENCE_WINDOW,
  FERTILE_WINDOW,
  HISTORY_CONFIDENCE,
  MUCUS_ONLY_OVULATION_CONFIDENCE,
  SUPPORTING_EVIDENCE_WEIGHT,
  UNCERTAINTY,
} from './config';
import { gatherEvidence, observationsUpTo, type Evidence } from './evidence';
import { predictCycle } from './profile';
import type { Observation, Profile, State } from './types';

type Prediction = ReturnType<typeof predictCycle>;
type PhaseResult = Pick<
  State,
  'phase' | 'phaseConfidence' | 'ovulationStatus' | 'ovulationConfidence'
>;

/** Confidence in a calendar prediction: grows with completed cycles, drops once overdue. */
function calendarConfidence(profile: Profile, historyCount: number, daysOverdue: number) {
  const { base, perCompletedCycle, max, irregularPenalty, overdueTimeConstantDays } =
    HISTORY_CONFIDENCE;
  const historyWeight =
    clamp(base + historyCount * perCompletedCycle, max) *
    (profile.irregularCycles ? irregularPenalty : 1);
  return {
    historyWeight,
    confidence: historyWeight * decayFactor(daysOverdue, overdueTimeConstantDays),
  };
}

/** Half-width in days of the prediction window; wider for irregular or widely varying cycles. */
function predictionUncertaintyDays(profile: Profile) {
  const { minDays, rangeDivisor } = profile.irregularCycles
    ? UNCERTAINTY.irregular
    : UNCERTAINTY.regular;
  const range = profile.cycleLengthMaxDays - profile.cycleLengthMinDays;
  return Math.max(minDays, Math.ceil(range / rangeDivisor));
}

/**
 * Picks the phase from the strongest evidence, in priority order:
 * bleeding, temperature rise, LH surge, fertile mucus, then the calendar prediction.
 * `fallback` is what the state already says when no evidence applies.
 */
function pickPhase(
  evidence: Evidence,
  fallback: PhaseResult,
  calendar: { prediction: Prediction | null; fertileWindowStart: Date | null; confidence: number },
  now: Date,
): PhaseResult {
  const { withTemperature, withLh } = SUPPORTING_EVIDENCE_WEIGHT;
  if (evidence.bleeding) {
    return {
      phase: 'menstrual',
      phaseConfidence: evidence.bleeding,
      ovulationStatus: 'not_detected',
      ovulationConfidence: 0,
    };
  }
  if (evidence.temperature) {
    return {
      phase: 'luteal',
      phaseConfidence: evidence.temperature,
      ovulationStatus: 'likely',
      ovulationConfidence: clamp(
        weightedSum([
          [evidence.temperature, 1],
          [evidence.lh, withTemperature.lh],
          [evidence.mucus, withTemperature.mucus],
        ]),
        withTemperature.max,
      ),
    };
  }
  if (evidence.lh) {
    const confidence = clamp(
      weightedSum([
        [evidence.lh, 1],
        [evidence.mucus, withLh.mucus],
      ]),
      withLh.max,
    );
    return {
      phase: 'ovulation_likely',
      phaseConfidence: confidence,
      ovulationStatus: 'likely',
      ovulationConfidence: confidence,
    };
  }
  if (evidence.mucus) {
    return {
      ...fallback,
      phase: 'fertile',
      phaseConfidence: evidence.mucus,
      ovulationConfidence: Math.max(fallback.ovulationConfidence, MUCUS_ONLY_OVULATION_CONFIDENCE),
    };
  }
  const { prediction, fertileWindowStart, confidence } = calendar;
  if (prediction && now < prediction.predictedOvulationAt) {
    return {
      ...fallback,
      phase: now >= fertileWindowStart! ? 'fertile' : 'follicular',
      phaseConfidence: confidence,
    };
  }
  return fallback;
}

/**
 * Dates implied by observed evidence (temperature rise or LH surge), which replace the calendar
 * estimates. Returns nothing when there is no such evidence or the patient is menstruating.
 */
function evidenceWindow(evidence: Evidence, profile: Profile) {
  if (evidence.bleeding || !(evidence.temperature || evidence.lh)) return null;
  const {
    daysBeforeRise,
    daysAfterLhSurge,
    daysToOvulation,
    daysToNextPeriod,
    irregularPaddingDays,
  } = EVIDENCE_WINDOW;
  const fromTemperature = evidence.temperature > 0;
  const event = fromTemperature ? evidence.temperatureRise! : evidence.lhReading!.observedAt;
  const start = addDays(event, fromTemperature ? -daysBeforeRise : 0);
  const end = addDays(event, fromTemperature ? 0 : daysAfterLhSurge);
  const padding = profile.irregularCycles ? irregularPaddingDays : 0;
  return {
    start,
    end,
    predictedOvulationAt: addDays(start, daysToOvulation),
    predictedNextPeriodAt: addDays(start, daysToNextPeriod),
    fertileWindowStart: addDays(start, -FERTILE_WINDOW.daysBeforeOvulation - padding),
    fertileWindowEnd: addDays(end, FERTILE_WINDOW.daysAfterOvulation + padding),
  };
}

/**
 * Where the patient is in their cycle right now, and how sure we are.
 * `startedAt` is the active cycle's start (null if none), `historyCount` is completed cycles.
 */
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
  const rows = observationsUpTo(observations, now).filter(
    (o) => !startedAt || o.observedAt >= startedAt,
  );
  const evidence = gatherEvidence(rows, now);

  const prediction = startedAt ? predictCycle(startedAt, profile) : null;
  const daysOverdue = prediction
    ? Math.max(0, daysBetween(prediction.predictedOvulationAt, now))
    : 0;
  const { historyWeight, confidence } = calendarConfidence(profile, historyCount, daysOverdue);
  const uncertainty = predictionUncertaintyDays(profile);
  const fertileWindowStart = prediction
    ? addDays(prediction.predictedOvulationAt, -FERTILE_WINDOW.daysBeforeOvulation - uncertainty)
    : null;

  const calendarPhase: PhaseResult = {
    phase: 'unknown',
    phaseConfidence: 0,
    ovulationStatus: prediction && daysOverdue <= uncertainty ? 'predicted' : 'unknown',
    ovulationConfidence: prediction ? confidence : 0,
  };

  const state: State = {
    calculatedAt: now,
    cycleDay: startedAt ? daysBetween(startedAt, now) + 1 : null,
    ...pickPhase(evidence, calendarPhase, { prediction, fertileWindowStart, confidence }, now),
    predictedOvulationAt: prediction?.predictedOvulationAt ?? null,
    predictedNextPeriodAt: prediction?.predictedNextPeriodAt ?? null,
    fertileWindowStart,
    fertileWindowEnd: prediction
      ? addDays(prediction.predictedOvulationAt, FERTILE_WINDOW.daysAfterOvulation + uncertainty)
      : null,
    reasoning: {
      algorithmVersion: 'v1',
      cycleHistoryWeight: historyWeight,
      bleedingEvidence: evidence.bleeding,
      lhEvidence: evidence.lh,
      mucusEvidence: evidence.mucus,
      temperatureEvidence: evidence.temperature,
    },
  };

  // Observed evidence replaces the calendar estimates; there is never an exact "confirmed" date.
  const window = evidenceWindow(evidence, profile);
  if (window) {
    state.reasoning.ovulationWindowStart = window.start.toISOString();
    state.reasoning.ovulationWindowEnd = window.end.toISOString();
    state.predictedOvulationAt = window.predictedOvulationAt;
    state.predictedNextPeriodAt = window.predictedNextPeriodAt;
    state.fertileWindowStart = window.fertileWindowStart;
    state.fertileWindowEnd = window.fertileWindowEnd;
  }
  return state;
}
