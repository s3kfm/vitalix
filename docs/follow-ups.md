# Demo follow-ups

Patient enrollment, selection, and record routes are implemented. Keep the remaining work proportional to a public source-code demo:

- Add a license, screenshots, and a short walkthrough.
- Optionally seed several named patients with synthetic records for a ready-to-explore demo.
- Replace or clearly label remaining static data in HealthRecordsContext; report uploads and pinning are still no-ops.
- Fix assistant partial-save progress: successful symptom resolution skips the progress callback, so a mixed failed/successful batch can omit saved resolutions from the review card.
- Batch the timeline's per-measurement database reads and handle all supported result types in its display.
- Remove the three unused validation helpers currently reported by lint.

Authentication and user-to-patient access rules are deliberately outside this demo's scope. All patients are shared. Patient selection is in memory and resets on refresh; remember selection only if useful later. Switching patients discards drafts and chat; requests already submitted remain bound to the original patient and may finish saving there.

Existing databases need the one-time `drizzle/patients.sql` update before using the new schema. This repository still does not have a complete migration history.
