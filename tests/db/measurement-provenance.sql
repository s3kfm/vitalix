-- Run against a disposable database after applying all migrations.
BEGIN;
DO $$
DECLARE
  p uuid; other_p uuid; conversation uuid; source uuid; other_source uuid;
  def uuid; bp uuid; glucose uuid; bp_revision uuid; glucose_revision uuid;
  submission uuid;
BEGIN
  INSERT INTO patients ("authUserId") VALUES ('test-patient') RETURNING id INTO p;
  INSERT INTO patients ("authUserId") VALUES ('test-other') RETURNING id INTO other_p;
  INSERT INTO measurement_conversations ("patientId") VALUES (p) RETURNING id INTO conversation;
  INSERT INTO measurement_sources ("patientId", kind, "actorId", "conversationId", role, content, "occurredAt")
    VALUES (p, 'message', 'test-patient', conversation, 'user', 'BP 120/80 and glucose 95', now()) RETURNING id INTO source;
  INSERT INTO measurement_sources ("patientId", kind, "actorId", payload, "occurredAt")
    VALUES (other_p, 'manual_form', 'test-other', '{}', now()) RETURNING id INTO other_source;
  INSERT INTO measurement_definitions (slug, name, category, components)
    VALUES ('test-bp', 'Blood pressure', 'vital-signs', '[]') RETURNING id INTO def;
  INSERT INTO measurements ("patientId", "definitionId", "observedAt", "sourceType", "captureMethod", "verificationStatus")
    VALUES (p, def, now(), 'patient_reported', 'manual_form', 'user_confirmed') RETURNING id INTO bp;
  INSERT INTO measurements ("patientId", "definitionId", "observedAt", "sourceType", "captureMethod", "verificationStatus")
    VALUES (p, def, now(), 'patient_reported', 'manual_form', 'user_confirmed') RETURNING id INTO glucose;
  INSERT INTO measurement_values ("measurementId", "componentKey", result)
    VALUES (bp, 'systolic', '{"type":"quantity","value":{"value":120}}'),
           (bp, 'diastolic', '{"type":"quantity","value":{"value":80}}');
  IF (SELECT count(*) FROM measurement_values WHERE "measurementId" = bp) <> 2 THEN RAISE EXCEPTION 'Component grouping failed'; END IF;
  BEGIN
    INSERT INTO measurement_values ("measurementId", "componentKey", result) VALUES (bp, 'systolic', '{"type":"integer","value":120}');
    RAISE EXCEPTION 'Duplicate component accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  INSERT INTO measurement_revisions ("patientId", "measurementId", revision, action, "actorId", snapshot)
    VALUES (p, bp, 1, 'created', 'test-patient', '{"measurement":{},"definition":{},"results":[]}') RETURNING id INTO bp_revision;
  INSERT INTO measurement_revisions ("patientId", "measurementId", revision, action, "actorId", snapshot)
    VALUES (p, glucose, 1, 'created', 'test-patient', '{"measurement":{},"definition":{},"results":[]}') RETURNING id INTO glucose_revision;
  INSERT INTO measurement_revision_sources ("patientId", "revisionId", "sourceId") VALUES (p, bp_revision, source), (p, glucose_revision, source);
  IF (SELECT count(*) FROM measurement_revision_sources WHERE "sourceId" = source) <> 2 THEN RAISE EXCEPTION 'Source sharing failed'; END IF;
  BEGIN
    INSERT INTO measurement_revision_sources ("patientId", "revisionId", "sourceId") VALUES (p, bp_revision, other_source);
    RAISE EXCEPTION 'Cross-patient source accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    UPDATE measurement_sources SET content = 'Changed' WHERE id = source;
    RAISE EXCEPTION 'Evidence was mutable';
  EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
  BEGIN
    DELETE FROM measurement_revisions WHERE id = bp_revision;
    RAISE EXCEPTION 'Revision was removable';
  EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
  INSERT INTO measurement_submissions ("patientId", "actorId", "captureMethod", "idempotencyKey", "requestHash")
    VALUES (p, 'test-patient', 'manual_form', 'request-1', 'test-hash') RETURNING id INTO submission;
  BEGIN
    INSERT INTO measurement_submissions ("patientId", "actorId", "captureMethod", "idempotencyKey", "requestHash") VALUES (p, 'test-patient', 'manual_form', 'request-1', 'test-hash');
    RAISE EXCEPTION 'Duplicate request accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO measurement_submission_items ("patientId", "submissionId", "clientItemKey", status, draft)
      VALUES (p, submission, 'item-1', 'confirmed', '{}');
    RAISE EXCEPTION 'Confirmed item without measurement accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
ROLLBACK;
