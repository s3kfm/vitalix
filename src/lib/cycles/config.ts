/** Every tunable number in the cycle algorithm, in one place. All durations are in days. */

/** Meaningful bleeding this many days after the last bleeding starts a new cycle. */
export const NEW_CYCLE_GAP_DAYS = 10;

/** Fallbacks used until the patient has logged enough cycles to learn from. */
export const DEFAULT_CYCLE = {
  lengthDays: 28,
  lengthMinDays: 21,
  lengthMaxDays: 35,
  periodLengthDays: 5,
};

export const PROFILE_LEARNING = {
  /** Only the most recent cycles are used, so old habits fade out. */
  recentCyclesUsed: 12,
  /** Below `fewCyclesBelow` cycles the learned range is padded more widely. */
  fewCyclesBelow: 3,
  rangePaddingFewCycles: 7,
  rangePaddingManyCycles: 2,
  /** Cycle lengths differing by more than this mark the patient as irregular. */
  irregularSpreadDays: 7,
  /** How far past a period start to look for its last bleeding day. */
  maxPeriodScanDays: 15,
};

/** Ovulation happens this many days before the next period. */
export const LUTEAL_PHASE_DAYS = 14;

/** How strongly each kind of evidence points to a phase, from 0 to 1. */
export const EVIDENCE = {
  bleeding: { maxAgeDays: 1, score: 0.9 },
  lh: { maxAgeDays: 2, scores: { positive: 0.65, peak: 0.75 } as Record<string, number> },
  mucus: { maxAgeDays: 2, scores: { watery: 0.55, egg_white: 0.55 } as Record<string, number> },
  temperature: {
    score: 0.8,
    /** A rise counts as recent evidence for this long. */
    maxAgeDays: 16,
    /** Three-over-six rule: 3 days at least `minRise` °C above the 6 days before. */
    baselineDays: 6,
    testDays: 3,
    minRise: 0.2,
  },
};

/** Confidence in a calendar-based prediction. */
export const HISTORY_CONFIDENCE = {
  base: 0.25,
  perCompletedCycle: 0.07,
  max: 0.6,
  irregularPenalty: 0.5,
  /** Confidence fades with this time constant once ovulation is overdue. */
  overdueTimeConstantDays: 5,
};

/** Half-width of the prediction window is a share of the cycle length range. */
export const UNCERTAINTY = {
  regular: { minDays: 2, rangeDivisor: 4 },
  irregular: { minDays: 7, rangeDivisor: 2 },
};

export const FERTILE_WINDOW = {
  daysBeforeOvulation: 5,
  daysAfterOvulation: 1,
};

/** How much one weaker signal adds to the one that decides the phase. */
export const SUPPORTING_EVIDENCE_WEIGHT = {
  /** Added to temperature evidence when LH or mucus agree. */
  withTemperature: { lh: 0.1, mucus: 0.1, max: 0.95 },
  /** Added to LH evidence when mucus agrees. */
  withLh: { mucus: 0.15, max: 0.85 },
};

/** Floor for ovulation confidence when only mucus points to it. */
export const MUCUS_ONLY_OVULATION_CONFIDENCE = 0.35;

/** Dates taken from observed evidence rather than the calendar. */
export const EVIDENCE_WINDOW = {
  /** A temperature rise confirms ovulation happened up to this many days earlier. */
  daysBeforeRise: 2,
  /** An LH surge means ovulation follows within this many days. */
  daysAfterLhSurge: 2,
  /** Start-of-window to expected next period. */
  daysToNextPeriod: 15,
  /** Start-of-window to expected ovulation. */
  daysToOvulation: 1,
  irregularPaddingDays: 2,
};
