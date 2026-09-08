import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { captureMethod, measurements, patients } from './measurements';

export const sourceKind = pgEnum('measurement_source_kind', ['message', 'manual_form', 'report', 'device']);
export const messageRole = pgEnum('measurement_message_role', ['user', 'assistant']);
export const submissionStatus = pgEnum('measurement_submission_status', ['draft', 'needs_clarification', 'ready', 'partially_confirmed', 'confirmed', 'cancelled']);
export const itemStatus = pgEnum('measurement_submission_item_status', ['draft', 'needs_clarification', 'ready', 'confirmed', 'rejected']);
export const revisionAction = pgEnum('measurement_revision_action', ['created', 'corrected', 'confirmed', 'entered_in_error']);

export const measurementConversations = pgTable('measurement_conversations', {
  id: uuid().defaultRandom().primaryKey(),
  patientId: uuid().references(() => patients.id).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [unique('measurement_conversation_patient_unique').on(t.id, t.patientId)]);

/** Immutable evidence. A new correction is a new source, never replacement text. */
export const measurementSources = pgTable('measurement_sources', {
  id: uuid().defaultRandom().primaryKey(),
  patientId: uuid().references(() => patients.id).notNull(),
  kind: sourceKind().notNull(),
  actorId: text().notNull(), // Auth user ID or explicit service identity; not supplied by clients.
  conversationId: uuid(),
  role: messageRole(),
  content: text(), // Exact user/assistant message. Never hidden model reasoning.
  payload: jsonb().$type<Record<string, unknown>>(), // Original form fields/device payload/report metadata.
  attachmentKeys: jsonb().$type<string[]>().default([]).notNull(),
  occurredAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [
  unique('measurement_source_patient_unique').on(t.id, t.patientId),
  foreignKey({ columns: [t.conversationId, t.patientId], foreignColumns: [measurementConversations.id, measurementConversations.patientId] }),
  index('measurement_sources_patient_time_idx').on(t.patientId, t.createdAt),
  check('measurement_source_message_fields', sql`(${t.kind} = 'message' AND ${t.role} IS NOT NULL AND ${t.conversationId} IS NOT NULL AND ${t.content} IS NOT NULL) OR (${t.kind} <> 'message' AND ${t.role} IS NULL AND ${t.conversationId} IS NULL AND ${t.payload} IS NOT NULL)`),
  check('measurement_source_payload_object', sql`${t.payload} IS NULL OR jsonb_typeof(${t.payload}) = 'object'`),
  check('measurement_source_attachments_array', sql`jsonb_typeof(${t.attachmentKeys}) = 'array'`),
]);

/** Completed AI run: record failures as well as successes, without rewriting history. */
export const measurementAiRuns = pgTable('measurement_ai_runs', {
  id: uuid().defaultRandom().primaryKey(),
  patientId: uuid().references(() => patients.id).notNull(),
  provider: text().notNull(),
  model: text().notNull(),
  templateVersion: text().notNull(),
  parserVersion: text().notNull(),
  requestPayload: jsonb().$type<Record<string, unknown>>().notNull(), // Exact sanitized application request.
  responseText: text(), // Visible response; structured extraction is separate.
  structuredOutput: jsonb().$type<Record<string, unknown>>(),
  responseSourceId: uuid(),
  errorCode: text(),
  startedAt: timestamp({ withTimezone: true }).notNull(),
  completedAt: timestamp({ withTimezone: true }).notNull(),
}, t => [
  unique('measurement_ai_run_patient_unique').on(t.id, t.patientId),
  foreignKey({ columns: [t.responseSourceId, t.patientId], foreignColumns: [measurementSources.id, measurementSources.patientId] }),
  check('measurement_ai_run_time_order', sql`${t.completedAt} >= ${t.startedAt}`),
]);

export const measurementAiRunSources = pgTable('measurement_ai_run_sources', {
  patientId: uuid().notNull(),
  runId: uuid().notNull(),
  sourceId: uuid().notNull(),
}, t => [
  unique('measurement_ai_run_source_unique').on(t.runId, t.sourceId),
  foreignKey({ columns: [t.runId, t.patientId], foreignColumns: [measurementAiRuns.id, measurementAiRuns.patientId] }),
  foreignKey({ columns: [t.sourceId, t.patientId], foreignColumns: [measurementSources.id, measurementSources.patientId] }),
]);

export const measurementSubmissions = pgTable('measurement_submissions', {
  id: uuid().defaultRandom().primaryKey(),
  patientId: uuid().references(() => patients.id).notNull(),
  actorId: text().notNull(),
  captureMethod: captureMethod().notNull(),
  idempotencyKey: text().notNull(),
  requestHash: text().notNull(),
  version: integer().default(0).notNull(),
  status: submissionStatus().default('draft').notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [
  unique('measurement_submission_patient_unique').on(t.id, t.patientId),
  unique('measurement_submission_idempotency_unique').on(t.patientId, t.idempotencyKey),
]);

export const measurementSubmissionSources = pgTable('measurement_submission_sources', {
  patientId: uuid().notNull(),
  submissionId: uuid().notNull(),
  sourceId: uuid().notNull(),
}, t => [
  unique('measurement_submission_source_unique').on(t.submissionId, t.sourceId),
  foreignKey({ columns: [t.submissionId, t.patientId], foreignColumns: [measurementSubmissions.id, measurementSubmissions.patientId] }),
  foreignKey({ columns: [t.sourceId, t.patientId], foreignColumns: [measurementSources.id, measurementSources.patientId] }),
]);

export const measurementSubmissionItems = pgTable('measurement_submission_items', {
  id: uuid().defaultRandom().primaryKey(),
  patientId: uuid().notNull(),
  submissionId: uuid().notNull(),
  clientItemKey: text().notNull(),
  status: itemStatus().default('draft').notNull(),
  draft: jsonb().$type<Record<string, unknown>>().notNull(), // May be incomplete; validate before confirmation.
  issues: jsonb().$type<Array<{ field: string; code: string; message: string }>>().default([]).notNull(),
  aiRunId: uuid(),
  measurementId: uuid(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [
  unique('measurement_submission_item_patient_unique').on(t.id, t.patientId),
  unique('measurement_submission_item_key_unique').on(t.submissionId, t.clientItemKey),
  unique('measurement_submission_item_measurement_unique').on(t.measurementId),
  foreignKey({ columns: [t.submissionId, t.patientId], foreignColumns: [measurementSubmissions.id, measurementSubmissions.patientId] }),
  foreignKey({ columns: [t.aiRunId, t.patientId], foreignColumns: [measurementAiRuns.id, measurementAiRuns.patientId] }),
  foreignKey({ columns: [t.measurementId, t.patientId], foreignColumns: [measurements.id, measurements.patientId] }),
  check('measurement_item_confirmation', sql`(${t.status} = 'confirmed') = (${t.measurementId} IS NOT NULL)`),
]);

/** Full parent + component snapshot, including the definition used at this revision. */
export const measurementRevisions = pgTable('measurement_revisions', {
  id: uuid().defaultRandom().primaryKey(),
  patientId: uuid().notNull(),
  measurementId: uuid().notNull(),
  revision: integer().notNull(),
  action: revisionAction().notNull(),
  actorId: text().notNull(),
  reason: text(),
  snapshot: jsonb().$type<{ measurement: Record<string, unknown>; definition: Record<string, unknown>; results: Record<string, unknown>[] }>().notNull(),
  submissionItemId: uuid(),
  aiRunId: uuid(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [
  unique('measurement_revision_patient_unique').on(t.id, t.patientId),
  unique('measurement_revision_number_unique').on(t.measurementId, t.revision),
  foreignKey({ columns: [t.measurementId, t.patientId], foreignColumns: [measurements.id, measurements.patientId] }),
  foreignKey({ columns: [t.submissionItemId, t.patientId], foreignColumns: [measurementSubmissionItems.id, measurementSubmissionItems.patientId] }),
  foreignKey({ columns: [t.aiRunId, t.patientId], foreignColumns: [measurementAiRuns.id, measurementAiRuns.patientId] }),
  check('measurement_revision_positive', sql`${t.revision} > 0`),
  check('measurement_revision_snapshot_shape', sql`COALESCE(jsonb_typeof(${t.snapshot}->'measurement') = 'object' AND jsonb_typeof(${t.snapshot}->'definition') = 'object' AND jsonb_typeof(${t.snapshot}->'results') = 'array', false)`),
]);

/** Many-to-many: a message can support many readings; a revision can cite many messages. */
export const measurementRevisionSources = pgTable('measurement_revision_sources', {
  patientId: uuid().notNull(),
  revisionId: uuid().notNull(),
  sourceId: uuid().notNull(),
}, t => [
  unique('measurement_revision_source_unique').on(t.revisionId, t.sourceId),
  index('measurement_revision_sources_source_idx').on(t.sourceId),
  foreignKey({ columns: [t.revisionId, t.patientId], foreignColumns: [measurementRevisions.id, measurementRevisions.patientId] }),
  foreignKey({ columns: [t.sourceId, t.patientId], foreignColumns: [measurementSources.id, measurementSources.patientId] }),
]);
