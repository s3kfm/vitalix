import { createHash } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { measurementCatalog, type MeasurementDefinition } from '../../lib/measurements/catalog';
import { normalize, conversionVersion, toObservation } from '../../lib/measurements/observation';
import { ApiError, assess, obj, keys, str, uuid, list, version, parseItems } from './input';

type Q = Pool | PoolClient;
async function rows<T extends QueryResultRow = Record<string, unknown>>(db: Q, query: string, args: unknown[] = []) { return (await db.query<T>(query, args)).rows; }
async function one(db: Q, query: string, args: unknown[]) { const row = (await rows(db, query, args))[0]; if (!row) throw new ApiError(404, 'not_found', 'Record not found'); return row; }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
export class MeasurementService {
  constructor(private pool: Pool) {}
  private async tx<T>(fn: (c: PoolClient) => Promise<T>) { const c = await this.pool.connect(); try { await c.query('BEGIN'); const result = await fn(c); await c.query('COMMIT'); return result; } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); } }
  async patient(actor: string) {
    await this.pool.query('INSERT INTO patients ("authUserId") VALUES ($1) ON CONFLICT ("authUserId") DO NOTHING', [actor]);
    return String((await one(this.pool, 'SELECT id FROM patients WHERE "authUserId"=$1', [actor])).id);
  }
  async definitions() { return rows(this.pool, 'SELECT * FROM measurement_definitions ORDER BY slug'); }
  private async definitionsMap(c: Q) {
    const definitions = await rows(c, 'SELECT * FROM measurement_definitions');
    return new Map(definitions.map(d => [String(d.slug), { row: d, value: { ...d, loincCode: d.loincCode ?? undefined } as unknown as MeasurementDefinition }]));
  }
  async createConversation(patient: string) { return one(this.pool, 'INSERT INTO measurement_conversations ("patientId") VALUES ($1) RETURNING *', [patient]); }
  async createMessage(patient: string, actor: string, body: unknown) {
    const input = obj(body); keys(input, ['conversationId', 'content']);
    const conversation = uuid(input.conversationId); const content = str(input.content, 'message', 100000);
    await one(this.pool, 'SELECT id FROM measurement_conversations WHERE id=$1 AND "patientId"=$2', [conversation, patient]);
    return one(this.pool, `INSERT INTO measurement_sources ("patientId",kind,"actorId","conversationId",role,content,"occurredAt") VALUES ($1,'message',$2,$3,'user',$4,now()) RETURNING *`, [patient, actor, conversation, content]);
  }
  /** Internal server integration only. Never expose this method as a client write route. */
  async recordAiRun(patient: string, run: {
    provider: string; model: string; templateVersion: string; parserVersion: string;
    sourceIds: string[]; requestPayload: Record<string, unknown>; responseText: string;
    structuredOutput: { items: unknown }; startedAt: Date; completedAt: Date;
  }) {
    const sourceIds = [...new Set(list(run.sourceIds).map(uuid))];
    parseItems(run.structuredOutput.items);
    for (const field of ['provider', 'model', 'templateVersion', 'parserVersion'] as const) str(run[field], field, 200);
    if (!Number.isFinite(run.startedAt.getTime()) || !Number.isFinite(run.completedAt.getTime()) || run.completedAt < run.startedAt) throw new ApiError(400, 'invalid_input', 'Invalid AI run times');
    return this.tx(async c => {
      const sources = await rows(c, 'SELECT * FROM measurement_sources WHERE "patientId"=$1 AND id=ANY($2::uuid[])', [patient, sourceIds]);
      if (sources.length !== sourceIds.length) throw new ApiError(404, 'not_found', 'Source not found');
      const conversation = sources.find(s => s.role === 'user' && s.conversationId)?.conversationId;
      let responseSourceId = null;
      if (conversation) {
        const source = await one(c, `INSERT INTO measurement_sources ("patientId",kind,"actorId","conversationId",role,content,"occurredAt") VALUES ($1,'message','service:measurement-ai',$2,'assistant',$3,$4) RETURNING id`, [patient, conversation, run.responseText, run.completedAt]);
        responseSourceId = source.id;
      }
      const saved = await one(c, 'INSERT INTO measurement_ai_runs ("patientId",provider,model,"templateVersion","parserVersion","requestPayload","responseText","structuredOutput","responseSourceId","startedAt","completedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *', [patient, run.provider, run.model, run.templateVersion, run.parserVersion, JSON.stringify(run.requestPayload), run.responseText, JSON.stringify(run.structuredOutput), responseSourceId, run.startedAt, run.completedAt]);
      for (const sourceId of sourceIds) await c.query('INSERT INTO measurement_ai_run_sources ("patientId","runId","sourceId") VALUES ($1,$2,$3)', [patient, saved.id, sourceId]);
      return saved;
    });
  }
  async source(patient: string, id: string) { return one(this.pool, 'SELECT * FROM measurement_sources WHERE id=$1 AND "patientId"=$2', [uuid(id), patient]); }
  async submission(patient: string, id: string, c: Q = this.pool) {
    const submission = await one(c, 'SELECT * FROM measurement_submissions WHERE id=$1 AND "patientId"=$2', [uuid(id), patient]);
    const items = await rows(c, 'SELECT * FROM measurement_submission_items WHERE "submissionId"=$1 AND "patientId"=$2 ORDER BY "clientItemKey"', [id, patient]);
    const sources = await rows(c, 'SELECT "sourceId" FROM measurement_submission_sources WHERE "submissionId"=$1 AND "patientId"=$2', [id, patient]);
    return { ...submission, id: String(submission.id), items, sourceIds: sources.map(s => s.sourceId) };
  }
  async createSubmission(patient: string, actor: string, body: unknown, idempotencyKey: string) {
    str(idempotencyKey, 'Idempotency-Key', 200);
    const input = obj(body); keys(input, ['captureMethod', 'items', 'aiRunId']);
    if (!['manual_form', 'ai_conversation', 'ai_extraction'].includes(String(input.captureMethod))) throw new ApiError(400, 'invalid_input', 'Unsupported capture method');
    const hash = createHash('sha256').update(canonical(input)).digest('hex');
    return this.tx(async c => {
      // Serialize retries for a patient/key without creating duplicates under concurrency.
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [patient + ':' + idempotencyKey]);
      const previous = (await rows(c, 'SELECT id,"requestHash" FROM measurement_submissions WHERE "patientId"=$1 AND "idempotencyKey"=$2', [patient, idempotencyKey]))[0];
      if (previous) {
        if (previous.requestHash !== hash) throw new ApiError(409, 'idempotency_conflict', 'This key was used with different input');
        return { replayed: true, data: await this.submission(patient, String(previous.id), c) };
      }
      let sourceIds: string[]; let aiRunId: string | null = null; let itemInput: unknown = input.items;
      if (input.captureMethod === 'manual_form') {
        if (input.aiRunId !== undefined) throw new ApiError(400, 'invalid_input', 'Manual entry cannot claim an AI run');
        parseItems(itemInput);
        const source = await one(c, `INSERT INTO measurement_sources ("patientId",kind,"actorId",payload,"occurredAt") VALUES ($1,'manual_form',$2,$3,now()) RETURNING id`, [patient, actor, JSON.stringify(input)]);
        sourceIds = [String(source.id)];
      } else {
        if (input.items !== undefined) throw new ApiError(400, 'invalid_input', 'AI drafts must come from a recorded server AI run');
        aiRunId = uuid(input.aiRunId);
        const run = await one(c, 'SELECT * FROM measurement_ai_runs WHERE id=$1 AND "patientId"=$2', [aiRunId, patient]);
        if (run.errorCode || !run.structuredOutput) throw new ApiError(422, 'invalid_ai_run', 'AI run has no usable extraction');
        itemInput = obj(run.structuredOutput).items;
        const sources = await rows(c, 'SELECT s.* FROM measurement_sources s JOIN measurement_ai_run_sources l ON s.id=l."sourceId" AND s."patientId"=l."patientId" WHERE l."runId"=$1 AND l."patientId"=$2', [aiRunId, patient]);
        const valid = input.captureMethod === 'ai_conversation' ? sources.some(s => s.kind === 'message' && s.role === 'user') : sources.some(s => s.kind === 'report');
        if (!valid) throw new ApiError(422, 'invalid_ai_run', 'AI run lacks the required source evidence');
        sourceIds = sources.map(s => String(s.id));
        if (run.responseSourceId) sourceIds.push(String(run.responseSourceId));
      }
      const items = parseItems(itemInput); const definitions = await this.definitionsMap(c);
      const sub = await one(c, 'INSERT INTO measurement_submissions ("patientId","actorId","captureMethod","idempotencyKey","requestHash") VALUES ($1,$2,$3,$4,$5) RETURNING id', [patient, actor, input.captureMethod, idempotencyKey, hash]);
      for (const sourceId of new Set(sourceIds)) await c.query('INSERT INTO measurement_submission_sources ("patientId","submissionId","sourceId") VALUES ($1,$2,$3)', [patient, sub.id, sourceId]);
      for (const item of items) {
        const issues = assess(item.draft, definitions.get(item.draft.definition)?.value);
        await c.query('INSERT INTO measurement_submission_items ("patientId","submissionId","clientItemKey",draft,issues,status,"aiRunId") VALUES ($1,$2,$3,$4,$5,$6,$7)', [patient, sub.id, item.key, JSON.stringify(item.draft), JSON.stringify(issues), issues.length ? 'needs_clarification' : 'ready', aiRunId]);
      }
      await this.refresh(c, patient, String(sub.id), false);
      return { replayed: false, data: await this.submission(patient, String(sub.id), c) };
    });
  }
  private async refresh(c: PoolClient, patient: string, id: string, increment = true) {
    const items = await rows(c, 'SELECT status FROM measurement_submission_items WHERE "submissionId"=$1 AND "patientId"=$2', [id, patient]);
    const status = items.every(i => i.status === 'confirmed') ? 'confirmed' : items.some(i => i.status === 'confirmed') ? 'partially_confirmed' : items.every(i => i.status === 'ready') ? 'ready' : 'needs_clarification';
    await c.query('UPDATE measurement_submissions SET status=$1,version=version+$2,"updatedAt"=now() WHERE id=$3 AND "patientId"=$4', [status, increment ? 1 : 0, id, patient]);
  }
  async patchSubmission(patient: string, actor: string, id: string, body: unknown) {
    uuid(id); const input = obj(body); keys(input, ['version', 'items']); const expected = version(input.version); const replacements = parseItems(input.items);
    return this.tx(async c => {
      const sub = await one(c, 'SELECT * FROM measurement_submissions WHERE id=$1 AND "patientId"=$2 FOR UPDATE', [id, patient]);
      if (sub.version !== expected) throw new ApiError(409, 'version_conflict', 'Submission changed; reload before editing');
      const definitions = await this.definitionsMap(c);
      for (const replacement of replacements) {
        const item = await one(c, 'SELECT * FROM measurement_submission_items WHERE "submissionId"=$1 AND "patientId"=$2 AND "clientItemKey"=$3', [id, patient, replacement.key]);
        if (item.status === 'confirmed') throw new ApiError(409, 'already_confirmed', 'Confirmed readings cannot be edited as drafts');
        const issues = assess(replacement.draft, definitions.get(replacement.draft.definition)?.value);
        await c.query('UPDATE measurement_submission_items SET draft=$1,issues=$2,status=$3,"updatedAt"=now() WHERE id=$4 AND "patientId"=$5', [JSON.stringify(replacement.draft), JSON.stringify(issues), issues.length ? 'needs_clarification' : 'ready', item.id, patient]);
      }
      const source = await one(c, `INSERT INTO measurement_sources ("patientId",kind,"actorId",payload,"occurredAt") VALUES ($1,'manual_form',$2,$3,now()) RETURNING id`, [patient, actor, JSON.stringify({ action: 'draft_correction', submissionId: id, ...input })]);
      await c.query('INSERT INTO measurement_submission_sources ("patientId","submissionId","sourceId") VALUES ($1,$2,$3)', [patient, id, source.id]);
      await this.refresh(c, patient, id); return this.submission(patient, id, c);
    });
  }
  async confirm(patient: string, actor: string, id: string, body: unknown) {
    uuid(id); const input = obj(body); keys(input, ['version', 'itemIds']); const expected = version(input.version);
    const ids = list(input.itemIds).map(uuid); if (new Set(ids).size !== ids.length) throw new ApiError(400, 'invalid_input', 'Duplicate item IDs');
    return this.tx(async c => {
      const sub = await one(c, 'SELECT * FROM measurement_submissions WHERE id=$1 AND "patientId"=$2 FOR UPDATE', [id, patient]);
      const items = await rows(c, 'SELECT * FROM measurement_submission_items WHERE "submissionId"=$1 AND "patientId"=$2 AND id=ANY($3::uuid[]) ORDER BY id', [id, patient, ids]);
      if (items.length !== ids.length) throw new ApiError(404, 'not_found', 'Submission item not found');
      if (items.every(i => i.status === 'confirmed')) return this.submission(patient, id, c);
      if (sub.version !== expected) throw new ApiError(409, 'version_conflict', 'Submission changed; reload before confirming');
      const definitions = await this.definitionsMap(c);
      const sources = await rows(c, 'SELECT s.* FROM measurement_sources s JOIN measurement_submission_sources l ON s.id=l."sourceId" AND s."patientId"=l."patientId" WHERE l."submissionId"=$1 AND l."patientId"=$2', [id, patient]);
      const confirmation = await one(c, `INSERT INTO measurement_sources ("patientId",kind,"actorId",payload,"occurredAt") VALUES ($1,'manual_form',$2,$3,now()) RETURNING id`, [patient, actor, JSON.stringify({ action: 'confirmation', submissionId: id, ...input })]);
      await c.query('INSERT INTO measurement_submission_sources ("patientId","submissionId","sourceId") VALUES ($1,$2,$3)', [patient, id, confirmation.id]);
      for (const item of items) {
        if (item.status === 'confirmed') continue;
        const draft = parseItems([{ key: item.clientItemKey, draft: item.draft }])[0]!.draft;
        const definition = definitions.get(draft.definition); const issues = assess(draft, definition?.value);
        if (issues.length || !definition) throw new ApiError(422, 'needs_clarification', 'Resolve selected readings before confirming', { itemId: item.id, issues });
        const sourceType = sub.captureMethod === 'ai_extraction' ? 'report' : 'patient_reported';
        const measurement = await one(c, `INSERT INTO measurements ("patientId","definitionId","observedAt","sourceType","captureMethod","sourceReportId","sourceMessageId","verificationStatus","confirmedAt",notes,method,"bodySite") VALUES ($1,$2,$3,$4,$5,$6,$7,'user_confirmed',now(),$8,$9,$10) RETURNING *`, [patient, definition.row.id, draft.observedAt, sourceType, sub.captureMethod, sources.find(s => s.kind === 'report')?.id ?? null, sources.find(s => s.kind === 'message' && s.role === 'user')?.id ?? null, draft.notes ?? null, draft.method ?? null, draft.bodySite ?? null]);
        for (const reading of draft.readings) {
          const component = definition.value.components.find(c => c.key === reading.componentKey)!;
          let normalized: string | null = null;
          if (reading.result.type === 'quantity' && component.canonicalUnit && reading.result.value.value !== undefined && reading.result.value.code) {
            normalized = String(normalize(reading.result.value.value, reading.result.value.code, component.canonicalUnit));
            if (!Number.isFinite(Number(normalized))) throw new ApiError(422, 'invalid_result', 'Converted value is outside supported range');
          }
          await c.query('INSERT INTO measurement_values ("measurementId","componentKey","loincCode",result,"originalText",interpretation,"referenceRanges","normalizedValue","normalizedUnit","conversionVersion") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [measurement.id, reading.componentKey, component.loincCode ?? null, JSON.stringify(reading.result), reading.originalText ?? null, reading.interpretation ? JSON.stringify(reading.interpretation) : null, reading.referenceRanges ? JSON.stringify(reading.referenceRanges) : null, normalized, normalized === null ? null : component.canonicalUnit, normalized === null ? null : conversionVersion]);
        }
        await c.query(`UPDATE measurement_submission_items SET status='confirmed',"measurementId"=$1,"updatedAt"=now() WHERE id=$2 AND "patientId"=$3`, [measurement.id, item.id, patient]);
        const results = await rows(c, 'SELECT * FROM measurement_values WHERE "measurementId"=$1 ORDER BY "componentKey"', [measurement.id]);
        const revision = await one(c, `INSERT INTO measurement_revisions ("patientId","measurementId",revision,action,"actorId",snapshot,"submissionItemId","aiRunId") VALUES ($1,$2,1,'created',$3,$4,$5,$6) RETURNING id`, [patient, measurement.id, actor, JSON.stringify({ measurement, definition: definition.row, results }), item.id, item.aiRunId]);
        for (const source of [...sources, confirmation]) await c.query('INSERT INTO measurement_revision_sources ("patientId","revisionId","sourceId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [patient, revision.id, source.id]);
      }
      await this.refresh(c, patient, id); return this.submission(patient, id, c);
    });
  }
  async measurement(patient: string, id: string) {
    uuid(id); const measurement = await one(this.pool, 'SELECT * FROM measurements WHERE id=$1 AND "patientId"=$2', [id, patient]);
    const results = await rows(this.pool, 'SELECT * FROM measurement_values WHERE "measurementId"=$1 ORDER BY "componentKey"', [id]);
    return { ...measurement, results };
  }
  async history(patient: string, id: string) {
    await this.measurement(patient, id);
    return rows(this.pool, `SELECT r.*, COALESCE((SELECT jsonb_agg(l."sourceId") FROM measurement_revision_sources l WHERE l."revisionId"=r.id AND l."patientId"=$2),'[]') AS "sourceIds" FROM measurement_revisions r WHERE r."measurementId"=$1 AND r."patientId"=$2 ORDER BY revision`, [id, patient]);
  }
  async fhir(patient: string, id: string) {
    const revisions = await this.history(patient, id); const latest = revisions.at(-1);
    if (!latest) throw new ApiError(409, 'missing_revision', 'Measurement has no exportable revision');
    const snapshot = obj(latest.snapshot); const m = obj(snapshot.measurement);
    const definition = obj(snapshot.definition) as unknown as MeasurementDefinition;
    return toObservation({ ...definition, loincCode: definition.loincCode || undefined }, { id, patientId: patient, observedAt: String(m.observedAt), status: m.status as 'final', verificationStatus: 'user_confirmed', sourceType: m.sourceType as 'patient_reported', notes: m.notes ? String(m.notes) : undefined, method: m.method ? String(m.method) : undefined, bodySite: m.bodySite ? String(m.bodySite) : undefined, readings: parseItems([{ key: 'export', draft: { definition: definition.slug, readings: (snapshot.results as Record<string, unknown>[]).map(r => ({ componentKey: r.componentKey, result: r.result, ...(r.originalText ? { originalText: r.originalText } : {}), ...(r.interpretation ? { interpretation: r.interpretation } : {}), ...(r.referenceRanges ? { referenceRanges: r.referenceRanges } : {}) })) } }])[0]!.draft.readings });
  }
  async list(patient: string, url: URL) {
    const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 50;
    const offset = url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : 0;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 100000) throw new ApiError(400, 'invalid_input', 'Invalid pagination');
    const definition = url.searchParams.get('definition');
    return rows(this.pool, `SELECT m.*,d.slug AS definition,COALESCE((SELECT jsonb_agg(v ORDER BY v."componentKey") FROM measurement_values v WHERE v."measurementId"=m.id),'[]') AS results FROM measurements m JOIN measurement_definitions d ON d.id=m."definitionId" WHERE m."patientId"=$1 AND ($2::text IS NULL OR d.slug=$2) ORDER BY m."observedAt" DESC,m.id DESC LIMIT $3 OFFSET $4`, [patient, definition, limit, offset]);
  }
}

export async function seedMeasurementDefinitions(pool: Pool) {
  for (const definition of measurementCatalog) await pool.query('INSERT INTO measurement_definitions (slug,name,"loincCode",category,components) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING', [definition.slug, definition.name, definition.loincCode ?? null, definition.category, JSON.stringify(definition.components)]);
}
