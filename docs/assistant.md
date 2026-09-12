# Health assistant

The Assistant launcher opens a non-modal chat panel above the button. It uses Vercel AI SDK 7 with the Anthropic provider. Configure server-only `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL` (default: `claude-sonnet-5`).

## Interaction

1. Describe symptoms, medications, doses, or measurements; optionally attach images, PDFs, or plain-text files.
2. The assistant asks for required missing details and reads existing medications and the measurement catalogue when needed.
3. The `confirmRecords` client tool renders a changeset containing one or more records of any supported type. Review the actual values, dates, doses, and schedule times. Choose **Confirm & save**, **Make changes**, or **Cancel**.
4. Confirmation calls the existing record APIs individually. New medications are saved before dependent dose logs. Each result appears on its card and the relevant page queries refresh.

**Make changes** cancels the pending proposal so the user can describe corrections and receive a new review. No tool writes to health records on the server during generation. The confirmation button is the entry point for the client save function.

Successful records are excluded from subsequent retries within the same card. Definite validation failures can be retried. A network error or server failure can occur after a write, so these are marked unverified and are not automatically retried. The user can check the appropriate record page and choose **Done** before continuing the conversation. Cross-request idempotency and batch atomicity are deferred.

## Inputs and lifetime

Supported uploads: JPEG, PNG, WebP, GIF, PDF, and TXT. Up to three files per message, 3 MB each, 8 MB total. Unsupported formats such as HEIC, audio, and video are rejected with an actionable message; convert these to a supported format first. Inline chat requests are capped at 24 MB and 120 messages. The model must support the selected media.

Files are sent inline to `/api/patients/[patientId]/chat` and Anthropic, with no upload storage or database transcript. The API accepts inline file data only, not arbitrary remote file URLs. Local previews are cleared with the conversation. Provider-side retention is governed by the Anthropic account configuration.

The chat hook and confirmation cards stay mounted in the root layout. Closing/reopening the panel and client-side navigation preserve the conversation and any in-flight save results. Refreshing or starting a new chat clears conversation state; approved health records remain in the database. Nothing uses localStorage or sessionStorage.

## Implementation

- `app/api/patients/[patientId]/chat/route.ts`: request validation, inline media limits, streaming agent response, and reuse of medication/catalogue GET handlers.
- `src/lib/assistant/agent.ts`: Anthropic model, recording instructions, context lookup, and typed confirmation tool.
- `src/lib/assistant/changeset.ts`: schemas and readable review fields for mixed batches.
- `src/lib/assistant/save.ts`: confirmed client-side calls to existing APIs and per-record results.
- `src/components/assistant/AssistantBubble.tsx`: anchored panel, composer, attachments, and memory-only chat.
- `src/components/assistant/ChangesetCard.tsx`: review, confirmation, corrections, and partial results.

Measurements are limited to the existing catalogue. AI-created measurement groups validate their components before writes and discard any supplied transcript. Medication schedules support the existing daily clock times and as-needed mode; other schedules require clarification. The assistant does not choose a medication dose or diagnose symptoms.

## Checks

Run `node --import tsx --test tests/*.test.mjs` and `npm run check`. Tests cover mixed batches, medication dependencies, partial failures, retry behavior, extraction validation, and attachment constraints. For a manual smoke test, request a symptom and medication in one message, confirm that no writes occur before confirmation, then exercise confirm/cancel/correct and navigation. Test the panel on desktop and mobile. Use synthetic data in the existing demo workspace.
