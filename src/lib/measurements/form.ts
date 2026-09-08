import type { ComponentDefinition } from './catalog';
import type { MeasurementResult } from './result';

export type ComponentDraft = Record<string, string>;
type InputKind = 'text' | 'number' | 'datetime-local' | 'time' | 'boolean' | 'comparator';
export interface ResultField { key: string; label: string; kind: InputKind; optional?: boolean }

const quantityFields = (prefix = '', label = ''): ResultField[] => [
  { key: `${prefix}value`, label: `${label}Value`, kind: 'number' },
  { key: `${prefix}unit`, label: `${label}Unit`, kind: 'text' },
  { key: `${prefix}comparator`, label: `${label}Comparator`, kind: 'comparator', optional: true },
];

export function resultFields(type: string): ResultField[] {
  switch (type) {
    case 'quantity': return quantityFields();
    case 'range': return [...quantityFields('low.', 'Low '), ...quantityFields('high.', 'High ')];
    case 'ratio': return [...quantityFields('numerator.', 'Numerator '), ...quantityFields('denominator.', 'Denominator ')];
    case 'coded': case 'absent': return [
      { key: 'code', label: 'Code', kind: 'text' },
      { key: 'system', label: 'Code system', kind: 'text', optional: true },
      { key: 'display', label: 'Description', kind: 'text', optional: true },
    ];
    case 'period': return [
      { key: 'start', label: 'Start', kind: 'datetime-local' },
      { key: 'end', label: 'End', kind: 'datetime-local' },
    ];
    case 'string': return [{ key: 'value', label: 'Text', kind: 'text' }];
    case 'integer': return [{ key: 'value', label: 'Value', kind: 'number' }];
    case 'boolean': return [{ key: 'value', label: 'Result', kind: 'boolean' }];
    case 'time': return [{ key: 'value', label: 'Time', kind: 'time' }];
    case 'dateTime': return [{ key: 'value', label: 'Date and time', kind: 'datetime-local' }];
    default: return [];
  }
}

export function initialDraft(component: ComponentDefinition): ComponentDraft {
  return Object.fromEntries(resultFields(component.resultType).map(field => [
    field.key, field.key.endsWith('unit') ? component.unit ?? '' : '',
  ]));
}

type ResultValue = string | number | boolean | Record<string, unknown>;

export function serializeResult(component: ComponentDefinition, draft: ComponentDraft): MeasurementResult & { value: ResultValue } {
  const fields = resultFields(component.resultType);
  if (!fields.length) throw new Error(`Manual entry for ${component.resultType} is not supported yet.`);
  for (const field of fields) {
    const value = draft[field.key]?.trim() ?? '';
    if (!field.optional && !value) throw new Error(`${field.label} is required.`);
    if (field.kind === 'number' && value && !Number.isFinite(Number(value))) throw new Error(`${field.label} must be a number.`);
  }
  const quantity = (prefix = '') => ({
    value: Number(draft[`${prefix}value`]),
    unit: draft[`${prefix}unit`]!.trim(),
    ...(draft[`${prefix}comparator`] ? { comparator: draft[`${prefix}comparator`] } : {}),
  });
  const date = (key: string) => {
    const value = new Date(draft[key]!);
    if (Number.isNaN(value.getTime())) throw new Error('Enter a valid date and time.');
    return value.toISOString();
  };
  let value: ResultValue;
  switch (component.resultType) {
    case 'quantity': value = quantity(); break;
    case 'range': {
      const low = quantity('low.'); const high = quantity('high.');
      if (low.unit !== high.unit) throw new Error('Range units must match.');
      if (low.value > high.value) throw new Error('Low must not exceed high.');
      value = { low, high }; break;
    }
    case 'ratio': {
      const denominator = quantity('denominator.');
      if (denominator.value === 0) throw new Error('Denominator must not be zero.');
      value = { numerator: quantity('numerator.'), denominator }; break;
    }
    case 'coded': case 'absent': value = Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()])); break;
    case 'integer':
      value = Number(draft.value);
      if (!Number.isSafeInteger(value)) throw new Error('Enter a whole number within the supported range.');
      break;
    case 'boolean':
      if (!['true', 'false'].includes(draft.value!)) throw new Error('Choose Yes or No.');
      value = draft.value === 'true'; break;
    case 'dateTime': value = date('value'); break;
    case 'period': {
      const start = date('start'); const end = date('end');
      if (start > end) throw new Error('End must be after start.');
      value = { start, end }; break;
    }
    case 'time': value = draft.value!.length === 5 ? `${draft.value}:00` : draft.value!; break;
    default: value = draft.value!.trim();
  }
  return { type: component.resultType as MeasurementResult['type'], value };
}
