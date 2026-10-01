import { inArray } from 'drizzle-orm';
import { groupBy, keyBy, uniq } from 'es-toolkit';
import { db } from './index';
import { measurementDefinitions, measurementGroups, measurementValues } from './measurements';
import type { MeasurementRow, MeasurementWithValues } from './types';

/**
 * Adds each measurement's values, definition name and group source.
 * Uses three queries in total, however many measurements there are.
 */
export async function withMeasurementDetails(
  rows: MeasurementRow[],
): Promise<MeasurementWithValues[]> {
  if (!rows.length) return [];
  const [values, definitions, groups] = await Promise.all([
    db
      .select()
      .from(measurementValues)
      .where(
        inArray(
          measurementValues.measurementId,
          rows.map((row) => row.id),
        ),
      ),
    db
      .select({
        id: measurementDefinitions.id,
        name: measurementDefinitions.name,
        slug: measurementDefinitions.slug,
      })
      .from(measurementDefinitions)
      .where(inArray(measurementDefinitions.id, uniq(rows.map((row) => row.definitionId)))),
    db
      .select({ id: measurementGroups.id, source: measurementGroups.source })
      .from(measurementGroups)
      .where(inArray(measurementGroups.id, uniq(rows.map((row) => row.groupId)))),
  ]);

  const valuesByMeasurement = groupBy(values, (value) => value.measurementId);
  const definitionById = keyBy(definitions, (definition) => definition.id);
  const groupById = keyBy(groups, (group) => group.id);

  return rows.map((row) => ({
    ...row,
    definitionName: definitionById[row.definitionId]?.name ?? null,
    definitionSlug: definitionById[row.definitionId]?.slug ?? null,
    groupSource: groupById[row.groupId]?.source ?? null,
    values: valuesByMeasurement[row.id] ?? [],
  }));
}
