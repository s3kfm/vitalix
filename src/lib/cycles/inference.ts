/**
 * Cycle inference: public entry points. The work lives in sibling modules:
 * `starts` (segmenting cycles), `profile` (learning typical lengths), `evidence` (scoring
 * signals), `state` (phase and predictions), with all tunable numbers in `config`.
 */
export type { Observation, Profile, State } from './types';
export { utcDay } from '../math/days';
export { deriveCycleStarts } from './starts';
export { learnProfile, predictCycle } from './profile';
export { calculateCycleState } from './state';
