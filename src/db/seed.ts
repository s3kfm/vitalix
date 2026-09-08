import type { ComponentDefinition } from '../lib/measurements/catalog';
import { measurementDefinitions } from './measurements';
import { db } from './index';

export interface CatalogEntry {
  slug: string;
  name: string;
  loincCode: string | null;
  category: string;
  description: string;
  components: ComponentDefinition[];
}

export const catalog: CatalogEntry[] = [
  {
    slug: 'blood-pressure',
    name: 'Blood pressure',
    loincCode: '85354-9',
    category: 'vitals',
    description: 'Systolic and diastolic blood pressure',
    components: [
      { key: 'systolic', name: 'Systolic', loincCode: '8480-6', resultType: 'quantity', unit: 'mmHg' },
      { key: 'diastolic', name: 'Diastolic', loincCode: '8462-4', resultType: 'quantity', unit: 'mmHg' },
    ],
  },
  {
    slug: 'weight',
    name: 'Weight',
    loincCode: '29463-7',
    category: 'vitals',
    description: 'Body weight',
    components: [
      { key: 'value', name: 'Weight', loincCode: '29463-7', resultType: 'quantity', unit: 'kg' },
    ],
  },
  {
    slug: 'temperature',
    name: 'Body temperature',
    loincCode: '8310-5',
    category: 'vitals',
    description: 'Body temperature',
    components: [
      { key: 'value', name: 'Temperature', loincCode: '8310-5', resultType: 'quantity', unit: '°C' },
    ],
  },
  {
    slug: 'heart-rate',
    name: 'Resting heart rate',
    loincCode: '8867-4',
    category: 'vitals',
    description: 'Heart rate at rest',
    components: [
      { key: 'value', name: 'Heart rate', loincCode: '8867-4', resultType: 'quantity', unit: 'bpm' },
    ],
  },
  {
    slug: 'blood-glucose',
    name: 'Blood glucose',
    loincCode: '2339-0',
    category: 'labs',
    description: 'Blood glucose concentration',
    components: [
      { key: 'value', name: 'Glucose', loincCode: '2339-0', resultType: 'quantity', unit: 'mg/dL' },
    ],
  },
  {
    slug: 'oxygen-saturation',
    name: 'Oxygen saturation',
    loincCode: '2708-6',
    category: 'vitals',
    description: 'Peripheral oxygen saturation (SpO2)',
    components: [
      { key: 'value', name: 'SpO2', loincCode: '2708-6', resultType: 'quantity', unit: '%' },
    ],
  },
  {
    slug: 'waist-circumference',
    name: 'Waist circumference',
    loincCode: '8280-0',
    category: 'body-measure',
    description: 'Waist circumference measurement',
    components: [
      { key: 'value', name: 'Waist', loincCode: '8280-0', resultType: 'quantity', unit: 'cm' },
    ],
  },
  {
    slug: 'peak-flow',
    name: 'Peak expiratory flow',
    loincCode: '69114-7',
    category: 'vitals',
    description: 'Peak expiratory flow rate',
    components: [
      { key: 'value', name: 'PEF', loincCode: '69114-7', resultType: 'quantity', unit: 'L/min' },
    ],
  },
  {
    slug: 'height',
    name: 'Height',
    loincCode: '8302-2',
    category: 'body-measure',
    description: 'Body height',
    components: [
      { key: 'value', name: 'Height', loincCode: '8302-2', resultType: 'quantity', unit: 'cm' },
    ],
  },
  {
    slug: 'bmi',
    name: 'Body Mass Index',
    loincCode: '39156-5',
    category: 'vitals',
    description: 'Body mass index (BMI)',
    components: [
      { key: 'value', name: 'BMI', loincCode: '39156-5', resultType: 'quantity', unit: 'kg/m²' },
    ],
  },
];

/**
 * Upsert the measurement definitions catalogue. Safe to run multiple times.
 */
export async function seedDefinitions(): Promise<void> {
  for (const entry of catalog) {
    await db
      .insert(measurementDefinitions)
      .values({
        slug: entry.slug,
        name: entry.name,
        loincCode: entry.loincCode,
        category: entry.category,
        description: entry.description,
        components: entry.components,
      })
      .onConflictDoUpdate({
        target: measurementDefinitions.slug,
        set: {
          name: entry.name,
          loincCode: entry.loincCode,
          category: entry.category,
          description: entry.description,
          components: entry.components,
        },
      });
  }
}