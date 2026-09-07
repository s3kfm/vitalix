# Modal reference

`Modals.tsx.txt` preserves the original AI Studio demo for design reference only. It is not imported or compiled.

The current app uses feature components under `src/components/medications`, `records`, `symptoms`, and `assistant`. Shared presentation components live in `ui`; navigation lives in `layout`.

`HealthRecordsProvider` keeps demonstration records in memory across navigation. Entries and selected files reset on refresh. No backend, AI extraction, Bluetooth sync, prescription service, or persistence is connected.

Render `Modal` conditionally in the feature that owns the interaction. The native dialog provides focus containment, Escape dismissal, and focus restoration. Manual entry forms are reusable independently of the assistant. The assistant only previews messages and does not generate or save records.
