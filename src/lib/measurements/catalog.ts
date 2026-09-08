import type { ResultType } from './result';
export interface ComponentDefinition {
  key: string;
  loincCode?: string;
  allowedResultTypes: ResultType[];
  allowedUnits?: string[];
  canonicalUnit?: string;
}
export interface MeasurementDefinition {
  slug: string;
  name: string;
  loincCode?: string;
  category: 'vital-signs' | 'laboratory' | 'exam';
  components: ComponentDefinition[];
}
const single = (canonicalUnit: string, allowedUnits = [canonicalUnit]): ComponentDefinition[] => [{ key: 'value', allowedResultTypes: ['quantity', 'absent'], canonicalUnit, allowedUnits }];
export const measurementCatalog: MeasurementDefinition[] = [
  { slug: 'blood-pressure', name: 'Blood pressure', loincCode: '85354-9', category: 'vital-signs', components: [
    { key: 'systolic', allowedResultTypes: ['quantity', 'absent'], loincCode: '8480-6', canonicalUnit: 'mm[Hg]', allowedUnits: ['mm[Hg]'] },
    { key: 'diastolic', allowedResultTypes: ['quantity', 'absent'], loincCode: '8462-4', canonicalUnit: 'mm[Hg]', allowedUnits: ['mm[Hg]'] },
  ] },
  { slug: 'weight', name: 'Weight', loincCode: '29463-7', category: 'vital-signs', components: single('kg', ['kg', '[lb_av]']) },
  { slug: 'temperature', name: 'Temperature', loincCode: '8310-5', category: 'vital-signs', components: single('Cel', ['Cel', '[degF]']) },
  { slug: 'resting-heart-rate', name: 'Resting heart rate', loincCode: '8867-4', category: 'vital-signs', components: single('/min') },
  { slug: 'oxygen-saturation', name: 'Oxygen saturation', loincCode: '2708-6', category: 'vital-signs', components: single('%') },
  // These generic labels do not establish specimen, site, or method. Do not guess LOINC.
  { slug: 'blood-glucose', name: 'Blood glucose', category: 'laboratory', components: single('mg/dL') },
  { slug: 'waist-circumference', name: 'Waist circumference', category: 'exam', components: single('cm') },
  { slug: 'peak-flow', name: 'Peak flow', category: 'exam', components: single('L/min') },
];
