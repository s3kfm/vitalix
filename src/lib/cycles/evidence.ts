import { daysBetween, utcDay } from '../math/days';
import { findLatestStepUp, type DailyPoint } from '../math/series';
import { EVIDENCE } from './config';
import type { Observation } from './types';

const SOLID_BLEEDING = ['light', 'medium', 'heavy'];

/** Spotting and "none" do not count: only light, medium and heavy flow is a period day. */
export const isPeriodBleeding = (o: Observation) => SOLID_BLEEDING.includes(o.bleedingLevel ?? '');

/** Observations up to `now`, oldest first. Ties are broken by id so the order is stable. */
export const observationsUpTo = (observations: Observation[], now: Date) =>
  observations
    .filter((o) => o.observedAt <= now)
    .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime() || a.id.localeCompare(b.id));

/** The newest observation that has `field` filled in. */
const latestWith = (rows: Observation[], field: keyof Observation) =>
  rows.findLast((o) => o[field] !== null);

/** `score` for a reading no older than `maxAgeDays`, else 0. */
const scoreIfRecent = (
  reading: Observation | undefined,
  now: Date,
  maxAgeDays: number,
  score: (reading: Observation) => number,
) => (reading && daysBetween(reading.observedAt, now) <= maxAgeDays ? score(reading) : 0);

/**
 * The most recent day a basal temperature rise began, or null.
 * Conservative: this is a signal, not a medical confirmation of ovulation.
 */
export function findTemperatureRise(rows: Observation[]): Date | null {
  const lastReadingPerDay = new Map<number, Observation>();
  for (const o of rows)
    if (o.basalTemperatureCelsius !== null) lastReadingPerDay.set(utcDay(o.observedAt), o);
  const points: DailyPoint<Date>[] = [...lastReadingPerDay]
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([day, o]) => ({ day, value: o.basalTemperatureCelsius!, item: o.observedAt }));
  const { baselineDays, testDays, minRise } = EVIDENCE.temperature;
  return findLatestStepUp(points, { baselineDays, testDays, minRise }) ?? null;
}

export type Evidence = {
  bleeding: number;
  lh: number;
  mucus: number;
  temperature: number;
  /** Latest LH reading, used to date an ovulation window. */
  lhReading: Observation | undefined;
  /** Start of the latest temperature rise, if there is one. */
  temperatureRise: Date | null;
};

/** Scores each signal from 0 to 1 by how recent and how telling the latest reading is. */
export function gatherEvidence(rows: Observation[], now: Date): Evidence {
  const lhReading = latestWith(rows, 'lhResult');
  const mucusReading = latestWith(rows, 'cervicalMucus');
  const bleedingReading = rows.findLast((o) => o.bleedingLevel !== null || o.periodStarted);
  const temperatureRise = findTemperatureRise(rows);

  const temperatureIsRecent =
    temperatureRise !== null &&
    daysBetween(temperatureRise, now) <= EVIDENCE.temperature.maxAgeDays;

  return {
    bleeding: scoreIfRecent(bleedingReading, now, EVIDENCE.bleeding.maxAgeDays, (o) =>
      isPeriodBleeding(o) || o.periodStarted ? EVIDENCE.bleeding.score : 0,
    ),
    lh: scoreIfRecent(
      lhReading,
      now,
      EVIDENCE.lh.maxAgeDays,
      (o) => EVIDENCE.lh.scores[o.lhResult!] ?? 0,
    ),
    mucus: scoreIfRecent(
      mucusReading,
      now,
      EVIDENCE.mucus.maxAgeDays,
      (o) => EVIDENCE.mucus.scores[o.cervicalMucus!] ?? 0,
    ),
    temperature: temperatureIsRecent ? EVIDENCE.temperature.score : 0,
    lhReading,
    temperatureRise,
  };
}
