import type { ApiMeasurement } from '../../db/types';

function displayComponent(component: ApiMeasurement['values'][number]) {
  if (component.normalizedValue !== null) {
    return { value: component.normalizedValue, unit: component.normalizedUnit ?? '' };
  }
  const { type, value } = component.result;
  if (type === 'quantity' && typeof value === 'object' && value !== null) {
    return {
      value: 'value' in value && typeof value.value === 'number' ? String(value.value) : '—',
      unit: 'unit' in value && typeof value.unit === 'string' ? value.unit : '',
    };
  }
  return {
    value: typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '—',
    unit: '',
  };
}

export function displayMeasurement(measurement: Pick<ApiMeasurement, 'values'>): { value: string; unit: string } {
  const components = measurement.values.map(displayComponent);
  return {
    value: components.length ? components.map(component => component.value).join('/') : '—',
    unit: components[0]?.unit ?? '',
  };
}
