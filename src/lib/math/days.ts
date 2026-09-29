/** Whole-day arithmetic on UTC calendar days. Time of day is ignored. */
const MS_PER_DAY = 86_400_000;

/** Days since the Unix epoch, in UTC. Two timestamps on the same UTC date give the same number. */
export const utcDay = (date: Date) => Math.floor(date.getTime() / MS_PER_DAY);

/** Midnight UTC of `date`, shifted by a whole number of days. */
export const addDays = (date: Date, days: number) => new Date((utcDay(date) + days) * MS_PER_DAY);

/** Whole UTC days from `earlier` to `later` (negative if `later` comes first). */
export const daysBetween = (earlier: Date, later: Date) => utcDay(later) - utcDay(earlier);
