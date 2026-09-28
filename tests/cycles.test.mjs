import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCycleState,
  deriveCycleStarts,
  learnProfile,
  predictCycle,
} from '../src/lib/cycles/inference.ts';
import {
  createCycleObservationSchema,
  updateCycleObservationSchema,
} from '../src/lib/validations/cycles.ts';
const date = (day) => new Date(`2026-01-${String(day).padStart(2, '0')}T12:00:00Z`);
const observation = (day, fields = {}) => ({
  id: String(day),
  observedAt: date(day),
  bleedingLevel: null,
  cervicalMucus: null,
  lhResult: null,
  basalTemperatureCelsius: null,
  ...fields,
});
const profile = learnProfile([], []);
const state = (day, observations = [], extra = {}) =>
  calculateCycleState({
    now: date(day),
    startedAt: date(1),
    profile,
    historyCount: 0,
    observations,
    ...extra,
  });

test('no history has conservative defaults and no fabricated cycle', () => {
  assert.equal(profile.typicalCycleLengthDays, 28);
  const result = state(1, [], { startedAt: null });
  assert.equal(result.cycleDay, null);
  assert.equal(result.phase, 'unknown');
  assert.equal(result.predictedOvulationAt, null);
  assert.equal(state(3).phase, 'follicular');
  assert.ok(state(3).phaseConfidence < 0.5);
});
test('spotting never starts a cycle; repeated bleeding stays in the same cycle', () => {
  const rows = [
    observation(1, { bleedingLevel: 'spotting' }),
    ...[2, 3, 5, 25].map((day) => observation(day, { bleedingLevel: 'light' })),
  ];
  assert.deepEqual(
    deriveCycleStarts(rows.reverse(), date(30)).map((d) => d.toISOString()),
    ['2026-01-02T00:00:00.000Z', '2026-01-25T00:00:00.000Z'],
  );
  assert.equal(deriveCycleStarts([observation(1, { bleedingLevel: 'none' })], date(30)).length, 0);
});
test('deleting or correcting start observations deterministically changes boundaries', () => {
  const rows = [
    observation(1, { bleedingLevel: 'medium' }),
    observation(2, { bleedingLevel: 'medium' }),
    observation(29, { bleedingLevel: 'heavy' }),
  ];
  assert.equal(deriveCycleStarts(rows, date(30)).length, 2);
  assert.equal(deriveCycleStarts(rows.slice(1), date(30))[0].getUTCDate(), 2);
  assert.equal(
    deriveCycleStarts(
      rows.map((o) => ({ ...o, bleedingLevel: 'spotting' })),
      date(30),
    ).length,
    0,
  );
});
test('history learns length; irregular history widens uncertainty and lowers confidence', () => {
  const starts = ['2025-09-01', '2025-09-29', '2025-11-15', '2026-01-01'].map((d) => new Date(d));
  const learned = learnProfile(starts, []);
  assert.equal(learned.typicalCycleLengthDays, 47);
  assert.equal(learned.irregularCycles, true);
  const regular = state(10, [], {
    profile: { ...profile, irregularCycles: false },
    historyCount: 5,
  });
  const irregular = state(10, [], {
    profile: { ...profile, irregularCycles: true },
    historyCount: 5,
  });
  assert.ok(irregular.phaseConfidence < regular.phaseConfidence);
  assert.ok(irregular.fertileWindowStart < regular.fertileWindowStart);
  assert.ok(irregular.fertileWindowEnd > regular.fertileWindowEnd);
});
test('period duration requires an observed end rather than treating missing logs as none', () => {
  const starts = [date(1), date(29)];
  const rows = [1, 2, 3].map((d) => observation(d, { bleedingLevel: 'light' }));
  assert.equal(learnProfile(starts, rows).typicalPeriodLengthDays, 5);
  assert.equal(
    learnProfile(starts, [...rows, observation(4, { bleedingLevel: 'none' })])
      .typicalPeriodLengthDays,
    3,
  );
});
test('predictions never confirm ovulation or force a luteal phase; confidence decays', () => {
  assert.equal(
    predictCycle(date(1), profile).predictedNextPeriodAt.toISOString(),
    '2026-01-29T00:00:00.000Z',
  );
  for (let day = 1; day <= 31; day++) assert.notEqual(state(day).ovulationStatus, 'confirmed');
  assert.equal(state(25).phase, 'unknown');
  assert.ok(state(30).ovulationConfidence < state(17).ovulationConfidence);
});
test('recent LH and fertile mucus strengthen inference but expire; negative supersedes positive', () => {
  const positive = observation(12, { lhResult: 'positive' });
  const mucus = observation(12, { cervicalMucus: 'egg_white' });
  assert.equal(state(12, [mucus]).phase, 'fertile');
  assert.equal(state(12, [positive]).ovulationStatus, 'likely');
  assert.ok(
    state(12, [positive, mucus]).ovulationConfidence > state(12, [positive]).ovulationConfidence,
  );
  assert.notEqual(state(20, [positive, mucus]).ovulationStatus, 'likely');
  assert.notEqual(
    state(13, [positive, observation(13, { lhResult: 'negative' })]).ovulationStatus,
    'likely',
  );
  assert.equal(state(12, [positive], { startedAt: null }).phase, 'ovulation_likely');
});
test('sustained BBT rise needs six baseline days and three separate consecutive elevated days', () => {
  const temperatures = Array.from({ length: 9 }, (_, i) =>
    observation(i + 1, { basalTemperatureCelsius: i < 6 ? 36.3 : 36.6 }),
  );
  assert.equal(state(9, temperatures).phase, 'luteal');
  assert.equal(state(9, temperatures).ovulationStatus, 'likely');
  assert.notEqual(state(8, temperatures).phase, 'luteal');
  assert.notEqual(
    state(
      9,
      temperatures.filter((o) => o.id !== '4'),
    ).phase,
    'luteal',
  );
  assert.notEqual(
    state(9, [
      ...temperatures.slice(0, 6),
      ...Array.from({ length: 3 }, (_, i) =>
        observation(7, { id: `repeat-${i}`, basalTemperatureCelsius: 36.6 }),
      ),
    ]).phase,
    'luteal',
  );
  assert.equal(state(30, temperatures).phase, 'unknown');
});
test('new bleeding takes precedence and previous-cycle or future signals cannot leak', () => {
  const positive = observation(12, { lhResult: 'peak' });
  assert.equal(
    state(13, [positive, observation(13, { bleedingLevel: 'heavy' })]).phase,
    'menstrual',
  );
  assert.notEqual(state(10, [positive]).ovulationStatus, 'likely');
  assert.notEqual(state(20, [positive], { startedAt: date(19) }).ovulationStatus, 'likely');
});
test('UTC calendar days are stable across offset inputs and DST', () => {
  const result = state(10, [], {
    startedAt: new Date('2026-03-07T23:00:00-05:00'),
    now: new Date('2026-03-09T01:00:00-04:00'),
  });
  assert.equal(result.cycleDay, 2);
});
test('validation permits a single signal and explicit clearing; rejects invalid or owned fields', () => {
  const input = { observedAt: date(1).toISOString(), lhResult: 'positive' };
  assert.equal(createCycleObservationSchema.parse(input).bleedingLevel, undefined);
  assert.deepEqual(updateCycleObservationSchema.parse({ lhResult: null }), { lhResult: null });
  assert.ok(createCycleObservationSchema.safeParse({ observedAt: input.observedAt }).success);
  for (const bad of [
    { observedAt: null },
    { observedAt: '2026-01-01T12:00:00' },
    { observedAt: '2999-01-01T00:00:00Z' },
    { observedAt: '2026-02-30T00:00:00Z' },
    { bleedingLevel: 'severe' },
    { basalTemperatureCelsius: 80 },
    { patientId: 'injected' },
    { cycleId: 'injected' },
    { symptoms: 'pain' },
  ]) {
    assert.equal(createCycleObservationSchema.safeParse({ ...input, ...bad }).success, false);
  }
  assert.equal(updateCycleObservationSchema.safeParse({}).success, false);
});

test('explicit period starts preserve reported facts without inventing flow', () => {
  const rows = [observation(1, { periodStarted: true }), observation(8, { periodStarted: true })];
  assert.equal(deriveCycleStarts(rows, date(10)).length, 2);
  assert.equal(state(1, rows).phase, 'menstrual');
  assert.equal(rows[0].bleedingLevel, null);
});
test('LH evidence moves predictions with a window, never a confirmation', () => {
  const result = state(20, [observation(20, { lhResult: 'positive' })]);
  assert.equal(result.reasoning.ovulationWindowStart, '2026-01-20T00:00:00.000Z');
  assert.equal(result.reasoning.ovulationWindowEnd, '2026-01-22T00:00:00.000Z');
  assert.equal(result.predictedOvulationAt.toISOString(), '2026-01-21T00:00:00.000Z');
  assert.equal(result.ovulationStatus, 'likely');
});
