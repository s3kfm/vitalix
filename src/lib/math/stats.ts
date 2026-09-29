import { median } from 'es-toolkit';

/** Median rounded to a whole number. Use for day counts, where 28.5 days makes no sense. */
export const roundedMedian = (values: number[]) => Math.round(median(values));

/** Sum of `value * weight`. Weights need not add up to 1, so this is not an average. */
export const weightedSum = (terms: readonly (readonly [value: number, weight: number])[]) =>
  terms.reduce((total, [value, weight]) => total + value * weight, 0);

/**
 * Exponential decay: 1 when `elapsed` is 0, about 0.37 after one `timeConstant`,
 * about 0.05 after three.
 */
export const decayFactor = (elapsed: number, timeConstant: number) =>
  Math.exp(-elapsed / timeConstant);
