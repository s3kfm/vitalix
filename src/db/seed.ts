import type { Pool } from 'pg';
import { measurementCatalog } from '../lib/measurements/catalog';

export async function seedMeasurementDefinitions(pool: Pool) {
  for (const definition of measurementCatalog) {
    await pool.query(
      'INSERT INTO measurement_definitions (slug,name,"loincCode",category,components) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING',
      [definition.slug, definition.name, definition.loincCode ?? null, definition.category, JSON.stringify(definition.components)]
    );
  }
}