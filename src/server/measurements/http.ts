import { ApiError, obj, keys, str } from './input';
import type { MeasurementService } from './service';

async function body(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ApiError(415, 'unsupported_media_type', 'Send application/json');
  if (Number(request.headers.get('content-length')) > 1_000_000) throw new ApiError(413, 'payload_too_large', 'Request exceeds 1 MB');
  const reader = request.body?.getReader(); if (!reader) throw new ApiError(400, 'invalid_json', 'JSON body required');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 1_000_000) { await reader.cancel(); throw new ApiError(413, 'payload_too_large', 'Request exceeds 1 MB'); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ApiError(400, 'invalid_json', 'Invalid JSON'); }
  } finally { reader.releaseLock(); }
}
function response(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
export function measurementHandler(service: MeasurementService, authenticate: () => Promise<string | null>) {
  return async (request: Request): Promise<Response> => {
    try {
      const actor = await authenticate(); if (!actor) throw new ApiError(401, 'unauthenticated', 'Sign in to access health records');
      const url = new URL(request.url); const method = request.method === 'HEAD' ? 'GET' : request.method;
      if (method !== 'GET') {
        const origin = request.headers.get('origin');
        if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403, 'origin_rejected', 'Cross-origin writes are not allowed');
      }
      const path = url.pathname.replace(/\/$/, '').split('/').filter(Boolean).slice(1);
      const resource = path[0]; const id = path[1]; const child = path[2];
      if (path.length > 3) throw new ApiError(404, 'not_found', 'Route not found');
      const route = path.join('/');
      const routes: Array<[RegExp, string[]]> = [
        [/^measurement-definitions$/, ['GET']],
        [/^measurement-conversations$/, ['POST']],
        [/^measurement-sources$/, ['POST']],
        [/^measurement-sources\/[^/]+$/, ['GET']],
        [/^measurement-submissions$/, ['POST']],
        [/^measurement-submissions\/[^/]+$/, ['GET', 'PATCH']],
        [/^measurement-submissions\/[^/]+\/confirmations$/, ['POST']],
        [/^measurements(?:\/[^/]+(?:\/(?:fhir|revisions))?)?$/, ['GET']],
      ];
      const allowed = routes.find(([pattern]) => pattern.test(route))?.[1];
      if (!allowed) throw new ApiError(404, 'not_found', 'Route not found');
      if (!allowed.includes(method)) return response({ error: { code: 'method_not_allowed', message: 'Method not allowed' } }, 405, { Allow: allowed.join(', ') });
      const patient = await service.patient(actor);
      if (resource === 'measurement-definitions' && !id && method === 'GET') return response({ data: await service.definitions() });
      if (resource === 'measurement-conversations' && !id && method === 'POST') {
        const input = obj(await body(request)); keys(input, []);
        return response(await service.createConversation(patient), 201);
      }
      if (resource === 'measurement-sources' && !child) {
        if (!id && method === 'POST') return response(await service.createMessage(patient, actor, await body(request)), 201);
        if (id && method === 'GET') return response(await service.source(patient, id));
      }
      if (resource === 'measurement-submissions') {
        if (!id && method === 'POST') {
          const key = str(request.headers.get('idempotency-key'), 'Idempotency-Key', 200);
          const result = await service.createSubmission(patient, actor, await body(request), key);
          return response(result.data, result.replayed ? 200 : 201, { Location: `/api/measurement-submissions/${result.data.id}`, 'Idempotency-Replayed': String(result.replayed) });
        }
        if (id && !child && method === 'GET') return response(await service.submission(patient, id));
        if (id && !child && method === 'PATCH') return response(await service.patchSubmission(patient, actor, id, await body(request)));
        if (id && child === 'confirmations' && method === 'POST') return response(await service.confirm(patient, actor, id, await body(request)));
      }
      if (resource === 'measurements' && method === 'GET') {
        if (!id) return response({ data: await service.list(patient, url) });
        if (!child) return response(await service.measurement(patient, id));
        if (child === 'revisions') return response({ data: await service.history(patient, id) });
        if (child === 'fhir') return response(await service.fhir(patient, id), 200, { 'Content-Type': 'application/fhir+json' });
      }
      throw new ApiError(404, 'not_found', 'Route not found');
    } catch (error) {
      if (error instanceof ApiError) return response({ error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } }, error.status);
      // Do not expose database errors, SQL parameters, or clinical payloads.
      return response({ error: { code: 'internal_error', message: 'Unable to complete the request' } }, 500);
    }
  };
}
