import { createAgentUIStreamResponse } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createHealthAgent } from '@/src/lib/assistant/agent';
import { attachmentTypes, maxFileBytes, maxRequestBytes } from '@/src/lib/assistant/attachments';
import { GET as getMedications } from '../medications/route';
import { GET as getDefinitions } from '../measurements/definitions/route';
import { GET as getSymptoms } from '../symptoms/route';

export const maxDuration = 60;
const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    parts: z.array(z.object({ type: z.string() }).passthrough()).max(100),
  }).passthrough()).min(1).max(120),
  timezone: z.string().max(100).default('UTC').refine(value => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }, 'Invalid timezone.'),
});

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return new Response('The assistant needs an Anthropic API key. Add ANTHROPIC_API_KEY to the server environment.', { status: 503 });
  try {
    // Bound inline attachments before parsing, including chunked requests.
    const reader = request.body?.getReader();
    if (!reader) return new Response('A message is required.', { status: 400 });
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxRequestBytes) {
        await reader.cancel();
        return new Response('This chat is too large. Start a new chat or attach smaller files.', { status: 413 });
      }
      chunks.push(value);
    }
    const body = requestSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    for (const message of body.messages) {
      const files = message.parts.filter(part => part.type === 'file');
      if (files.length > 3) return new Response('Attach up to 3 files per message.', { status: 400 });
      for (const file of files) {
        if (message.role !== 'user' || typeof file.mediaType !== 'string' || !attachmentTypes.includes(file.mediaType) || typeof file.url !== 'string') {
          return new Response('Unsupported attachment. Use images, PDF, or TXT files.', { status: 400 });
        }
        // Only inline files are accepted: no provider fetches of arbitrary URLs.
        const prefix = `data:${file.mediaType};base64,`;
        if (!file.url.startsWith(prefix) || file.url.length > Math.ceil(maxFileBytes / 3) * 4 + prefix.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.url.slice(prefix.length))) {
          return new Response('Invalid attachment or file exceeds 3 MB.', { status: 400 });
        }
      }
    }
    const agent = createHealthAgent({
      timezone: body.timezone,
      getRecordContext: async () => {
        const [medications, definitions, symptomsData] = await Promise.all([getMedications(request), getDefinitions(), getSymptoms(request)]);
        if (!medications.ok || !definitions.ok || !symptomsData.ok) return { error: 'Could not load health record context. Ask the user to try again; do not guess medication IDs, symptom IDs, or measurement definitions.' };
        return { medications: await medications.json(), measurementDefinitions: await definitions.json(), symptoms: await symptomsData.json() };
      },
    });
    return await createAgentUIStreamResponse({
      agent,
      uiMessages: body.messages,
      abortSignal: request.signal,
      headers: { 'Cache-Control': 'no-store' },
      onError: () => 'The assistant could not finish its reply. Please try again. If this continues, check the Anthropic key and model configuration.',
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return new Response('This chat request is invalid or too long. Please start a new chat.', { status: 400 });
    return new Response('The assistant could not start. Please try again.', { status: 500 });
  }
}
