import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// Explicit opt-in: use ONLY an empty, disposable PostgreSQL database.
test(
  'cycle persistence, migrations, concurrent writes, corrections and patient isolation',
  { skip: !process.env.CYCLE_TEST_DATABASE_URL },
  async () => {
    process.env.DATABASE_URL = process.env.CYCLE_TEST_DATABASE_URL;
    const { pool } = await import('../src/db/index.ts');
    const service = await import('../src/lib/cycles/service.ts');
    try {
      const tables = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
      );
      assert.equal(
        tables.rowCount,
        0,
        'CYCLE_TEST_DATABASE_URL must refer to an empty disposable database',
      );
      const migrations = (
        await readdir(new URL('../drizzle/', import.meta.url), { withFileTypes: true })
      )
        .filter((d) => d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));
      for (const migration of migrations)
        await pool.query(
          await readFile(
            new URL(`../drizzle/${migration.name}/migration.sql`, import.meta.url),
            'utf8',
          ),
        );
      const patientId = randomUUID();
      const otherId = randomUUID();
      await pool.query('INSERT INTO patients (id, name) VALUES ($1, $2), ($3, $4)', [
        patientId,
        'Cycle test',
        otherId,
        'Other patient',
      ]);
      const empty = await service.getCurrentCycleState(patientId);
      assert.equal(empty.cycleId, null);
      assert.equal(empty.phase, 'unknown');
      const preCycle = await service.createCycleObservation(patientId, {
        observedAt: '2025-12-15T12:00:00Z',
        lhResult: 'positive',
      });
      assert.equal(preCycle.cycleId, null);
      const [first, second] = await Promise.all([
        service.createCycleObservation(patientId, {
          observedAt: '2026-01-01T12:00:00Z',
          bleedingLevel: 'medium',
        }),
        service.createCycleObservation(patientId, {
          observedAt: '2026-01-02T12:00:00Z',
          bleedingLevel: 'light',
        }),
      ]);
      assert.equal(
        (await service.listCycleObservations(patientId)).filter((o) => o.cycleId).length,
        2,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT * FROM menstrual_cycles WHERE patient_id = $1 AND status = 'active'",
            [patientId],
          )
        ).rowCount,
        1,
      );
      const next = await service.createCycleObservation(patientId, {
        observedAt: '2026-01-29T12:00:00Z',
        bleedingLevel: 'heavy',
      });
      let cycles = (
        await pool.query(
          'SELECT * FROM menstrual_cycles WHERE patient_id = $1 ORDER BY started_at',
          [patientId],
        )
      ).rows;
      assert.equal(cycles.length, 2);
      assert.equal(cycles[0].status, 'complete');
      assert.equal(cycles[0].ended_at.toISOString(), cycles[1].started_at.toISOString());
      assert.equal(cycles[1].id, next.cycleId);
      const state = await service.getCurrentCycleState(patientId);
      assert.equal(state.cycleId, next.cycleId);
      assert.equal(state.phase, 'unknown');
      assert.notEqual(state.ovulationStatus, 'confirmed');
      assert.equal(await service.getCycleObservation(otherId, first.id), null);
      await assert.rejects(
        service.updateCycleObservation(otherId, first.id, { notes: 'unauthorized' }),
        service.CycleObservationNotFound,
      );
      await assert.rejects(
        service.deleteCycleObservation(otherId, first.id),
        service.CycleObservationNotFound,
      );
      assert.equal((await service.listCycleObservations(otherId)).length, 0);
      await assert.rejects(
        pool.query(
          'INSERT INTO cycle_observations (patient_id, cycle_id, observed_at) VALUES ($1, $2, now())',
          [otherId, next.cycleId],
        ),
        /foreign key/,
      );
      await assert.rejects(
        pool.query(
          "INSERT INTO menstrual_cycles (patient_id, started_at, status) VALUES ($1, now(), 'active')",
          [patientId],
        ),
        /unique/,
      );
      await assert.rejects(
        pool.query('UPDATE cycle_states SET phase_confidence = 1.1 WHERE patient_id = $1', [
          patientId,
        ]),
        /check constraint/,
      );
      const corrected = await service.updateCycleObservation(patientId, next.id, {
        bleedingLevel: 'spotting',
        notes: null,
      });
      assert.equal(corrected.cycleId, first.cycleId);
      cycles = (
        await pool.query('SELECT * FROM menstrual_cycles WHERE patient_id = $1', [patientId])
      ).rows;
      assert.equal(cycles.length, 1);
      assert.equal(cycles[0].status, 'active');
      await service.deleteCycleObservation(patientId, first.id);
      const moved = await service.getCycleObservation(patientId, second.id);
      assert.notEqual(moved.cycleId, first.cycleId);
      assert.equal(
        (
          await pool.query('SELECT started_at FROM menstrual_cycles WHERE patient_id = $1', [
            patientId,
          ])
        ).rows[0].started_at.toISOString(),
        '2026-01-02T00:00:00.000Z',
      );
      await service.deleteCycleObservation(patientId, second.id);
      assert.equal((await service.getCurrentCycleState(patientId)).cycleId, null);
      assert.ok((await service.listCycleObservations(patientId)).every((o) => o.cycleId === null));
      assert.equal(
        (
          await pool.query(
            'SELECT typical_cycle_length_days FROM patient_cycle_profiles WHERE patient_id = $1',
            [patientId],
          )
        ).rows[0].typical_cycle_length_days,
        28,
      );
      assert.equal(
        (await pool.query('SELECT * FROM cycle_states WHERE patient_id = $1', [patientId]))
          .rowCount,
        1,
      );
      // Failed mutation rolls back both the observation and derived state.
      await assert.rejects(
        service.createCycleObservation(patientId, {
          observedAt: '2026-01-01T00:00:00Z',
          basalTemperatureCelsius: 100,
        }),
        /Failed query/,
      );
      assert.equal((await service.listCycleObservations(patientId)).length, 2);
      const setupId = randomUUID();
      await pool.query('INSERT INTO patients (id, name) VALUES ($1, $2)', [setupId, 'Setup test']);
      const answers = {
        lastPeriodStartedAt: '2026-01-05',
        typicalCycleLengthDays: 35,
        typicalPeriodLengthDays: 6,
        regularity: 'irregular',
      };
      await service.setupCycleTracking(setupId, answers);
      await service.setupCycleTracking(setupId, answers);
      let overview = await service.getCycleOverview(setupId);
      assert.equal(overview.observations.length, 1, 'Setup retries do not duplicate observations');
      assert.equal(overview.observations[0].periodStarted, true);
      assert.equal(
        overview.observations[0].bleedingLevel,
        null,
        'Setup never invents bleeding intensity',
      );
      assert.equal(overview.profile.typicalCycleLengthDays, 35);
      assert.equal(overview.profile.irregularCycles, true);
      const startId = overview.observations[0].id;
      await service.updateCycleObservation(setupId, startId, {
        observedAt: '2026-01-03T00:00:00Z',
      });
      overview = await service.getCycleOverview(setupId);
      assert.equal(overview.cycles[0].startedAt.toISOString(), '2026-01-03T00:00:00.000Z');
      assert.equal(overview.profile.typicalPeriodLengthDays, 6, 'Reported defaults survive edits');
      await service.deleteCycleObservation(setupId, startId);
      overview = await service.getCycleOverview(setupId);
      assert.equal(overview.state.cycleId, null);
      assert.equal(overview.profile.typicalCycleLengthDays, 35);
      assert.deepEqual(overview.profile.preferences, {
        typicalCycleLengthDays: 35,
        typicalPeriodLengthDays: 6,
        regularity: 'irregular',
      });
    } finally {
      await pool.end();
    }
  },
);
