import { windowed } from 'es-toolkit';

/** Absorbs floating-point error when comparing a sum such as 36.45 + 0.2 to a reading. */
const FLOAT_TOLERANCE = 1e-9;

export type DailyPoint<T> = { day: number; value: number; item: T };

/**
 * Finds the most recent step up in a daily series: `testDays` consecutive days that are each at
 * least `minRise` above the highest of the `baselineDays` days before them. Gaps in the days
 * break the pattern. Returns the first day of the raised run, or undefined if there is none.
 * `points` must be sorted by day, with one point per day.
 */
export function findLatestStepUp<T>(
  points: DailyPoint<T>[],
  { baselineDays, testDays, minRise }: { baselineDays: number; testDays: number; minRise: number },
): T | undefined {
  const size = baselineDays + testDays;
  const isUnbroken = (run: DailyPoint<T>[]) => run[size - 1]!.day - run[0]!.day === size - 1;
  const stepUp = windowed(points, size)
    .reverse()
    .find((run) => {
      if (!isUnbroken(run)) return false;
      const baseline = Math.max(...run.slice(0, baselineDays).map((p) => p.value));
      return run.slice(baselineDays).every((p) => p.value >= baseline + minRise - FLOAT_TOLERANCE);
    });
  return stepUp?.[baselineDays]!.item;
}
