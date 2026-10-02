import type { ComponentDefinition } from '../measurements/catalog';
import { recordSchema } from './changeset';

/** Validate extracted components before the existing API performs any writes. */
export function validateExtractedMeasurement(input: unknown, components: ComponentDefinition[]) {
  const parsed = recordSchema.safeParse({ key: 'validation', kind: 'measurement', data: input });
  if (!parsed.success || parsed.data.kind !== 'measurement')
    return 'The extracted measurement has an invalid value or timestamp.';
  const values = parsed.data.data.values;
  if (
    values.length !== components.length ||
    new Set(values.map((value) => value.componentKey)).size !== values.length
  )
    return 'Include each measurement component exactly once.';
  for (const value of values) {
    const component = components.find((item) => item.key === value.componentKey);
    if (
      !component ||
      (value.result.type !== 'absent' && value.result.type !== component.resultType)
    )
      return `Invalid component or result type: ${value.componentKey}.`;
    if (
      value.result.type === 'range' &&
      (value.result.value.low.unit !== value.result.value.high.unit ||
        value.result.value.low.value > value.result.value.high.value)
    )
      return 'Range bounds must have matching units and be in ascending order.';
    if (value.result.type === 'ratio' && value.result.value.denominator.value === 0)
      return 'A ratio denominator cannot be zero.';
    if (
      value.result.type === 'period' &&
      Date.parse(value.result.value.start) > Date.parse(value.result.value.end)
    )
      return 'A period must end at or after its start.';
  }
  return null;
}
