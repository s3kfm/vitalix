import test from 'node:test';
import assert from 'node:assert/strict';
import {
  predictionRanges,
  phaseLabel,
  confidenceLabel,
  observationLabels,
  predictionChange,
  relativeDay,
} from '../src/lib/cycles/presentation.ts';
import { cycleSetupSchema } from '../src/lib/validations/cycles.ts';
const overview = {
  state: {
    cycleId: 'cycle',
    cycleDay: 13,
    phase: 'fertile',
    phaseConfidence: 0.6,
    ovulationStatus: 'predicted',
    ovulationConfidence: 0.6,
    predictedOvulationAt: '2026-09-20T00:00:00Z',
    predictedNextPeriodAt: '2026-10-04T00:00:00Z',
    fertileWindowStart: '2026-09-13T00:00:00Z',
    fertileWindowEnd: '2026-09-23T00:00:00Z',
    reasoning: {},
  },
  profile: {
    typicalCycleLengthDays: 28,
    cycleLengthMinDays: 26,
    cycleLengthMaxDays: 30,
    irregularCycles: false,
  },
  observations: [],
  cycles: [],
};
test('lower confidence widens predictions and low certainty avoids a forced phase', () => {
  const usual = predictionRanges(overview);
  const uncertain = {
    ...overview,
    state: { ...overview.state, ovulationConfidence: 0.1, phaseConfidence: 0.1 },
  };
  const wide = predictionRanges(uncertain);
  assert.ok(wide.ovulation.start < usual.ovulation.start);
  assert.ok(wide.ovulation.end > usual.ovulation.end);
  assert.ok(wide.period.start < usual.period.start);
  assert.ok(wide.fertile.end > usual.fertile.end);
  assert.equal(phaseLabel(uncertain.state), 'Current phase uncertain');
  assert.deepEqual([0.1, 0.5, 0.8].map(confidenceLabel), ['Low', 'Moderate', 'High']);
});
test('likely window uses supporting evidence rather than a calendar estimate', () => {
  const ranges = predictionRanges({
    ...overview,
    state: {
      ...overview.state,
      ovulationStatus: 'likely',
      reasoning: {
        ovulationWindowStart: '2026-09-25T00:00:00Z',
        ovulationWindowEnd: '2026-09-27T00:00:00Z',
      },
    },
  });
  assert.deepEqual(ranges.ovulation, { start: '2026-09-25', end: '2026-09-27' });
});
test('unknown dates remain unknown; recorded signals are not invented', () => {
  assert.equal(
    predictionRanges({
      ...overview,
      state: {
        ...overview.state,
        predictedOvulationAt: null,
        predictedNextPeriodAt: null,
        fertileWindowStart: null,
      },
    }).ovulation,
    null,
  );
  assert.deepEqual(
    observationLabels({
      periodStarted: true,
      bleedingLevel: null,
      basalTemperatureCelsius: null,
      symptoms: null,
    }),
    ['Period started'],
  );
  assert.equal(relativeDay('2026-09-27T23:00:00-02:00', '2026-09-28'), 'Today');
});
test('prediction shift notices are factual and calm', () => {
  const changed = {
    ...overview,
    state: { ...overview.state, fertileWindowStart: '2026-09-16T00:00:00Z' },
  };
  assert.match(predictionChange(overview, changed), /3 days later/);
  assert.doesNotMatch(predictionChange(overview, changed), /overdue|abnormal|warning/i);
});
test('setup permits unknown answers and validates dates and lengths', () => {
  const empty = {
    lastPeriodStartedAt: null,
    typicalCycleLengthDays: null,
    typicalPeriodLengthDays: null,
    regularity: 'unknown',
  };
  assert.ok(cycleSetupSchema.safeParse(empty).success);
  for (const extra of [
    { lastPeriodStartedAt: '2026-02-30' },
    { lastPeriodStartedAt: '2999-01-01' },
    { typicalCycleLengthDays: 0 },
    { typicalPeriodLengthDays: -1 },
  ])
    assert.equal(cycleSetupSchema.safeParse({ ...empty, ...extra }).success, false);
});
