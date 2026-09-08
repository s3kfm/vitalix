# Modal reference

`Modals.tsx.txt` preserves the original AI Studio demo for design reference only. It is not imported or compiled.

The current app uses feature components under `src/components/medications`, `records`, `symptoms`, and `assistant`. Shared presentation components live in `ui`; navigation lives in `layout`.

`HealthRecordsProvider` supplies static overview demonstration data. The symptom, medication, dose, and measurement pages use backend APIs. The assistant proposes records through Anthropic and saves them through those APIs after confirmation.

Render `Modal` conditionally in the feature that owns the interaction. The native dialog provides focus containment, Escape dismissal, and focus restoration. Manual entry forms are reusable independently of the assistant. The assistant uses a separate non-modal panel anchored above its launcher. Chat and attachments stay in memory across panel toggles and navigation, and clear on refresh. Its confirmation tool displays proposed records before any saves. See [assistant guidance](../assistant.md).
