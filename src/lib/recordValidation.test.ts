import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseMedicineForm,
  parseDoseForm,
  parseMeasurementForm,
  parseSymptomForm,
  parseReportForm,
} from './recordValidation';
import type { Medicine } from '../types';

function form(fields: Record<string, string | File>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const medicine: Medicine = {
  id: 'test', name: 'Example', strength: '', dose: '1 tablet',
  schedule: [], notes: '', active: true,
};
const when = '2026-09-07T08:00';

test('required text rejects whitespace and file values instead of coercing them', () => {
  assert.throws(() => parseMedicineForm(form({ name: '   ', dose: '1 tablet' }), false));
  assert.throws(() => parseMedicineForm(form({ name: new File(['x'], 'x.txt'), dose: '1 tablet' }), false));
  const parsed = parseMedicineForm(form({ name: ' Example ', dose: ' 1 tablet ' }), false);
  assert.equal(parsed.name, 'Example');
  assert.equal(parsed.notes, '');
  assert.equal(parsed.dose, '1 tablet');
});

test('schedule and dose status are validated without type assertions', () => {
  assert.throws(() => parseMedicineForm(form({ name: 'Example', dose: '1 tablet', time: '25:80' }), true));
  assert.throws(() => parseDoseForm(form({ dose: '1 tablet', when, status: 'Anything' }), medicine));
  assert.equal(parseDoseForm(form({ dose: '1 tablet', when, status: 'Skipped' }), medicine).status, 'Skipped');
});

test('invalid calendar dates cannot silently roll over into another month', () => {
  assert.throws(() => parseSymptomForm(form({ name: 'Headache', when: '2026-02-30T08:00' })));
  assert.throws(() => parseSymptomForm(form({ name: 'Headache', when: 'invalid' })));
});

test('optional severity remains null and supplied severity is a bounded number', () => {
  assert.equal(parseSymptomForm(form({ name: 'Headache', when })).severity, null);
  assert.equal(parseSymptomForm(form({ name: 'Headache', when, severity: '3' })).severity, 3);
  for (const severity of ['0', '11', '2.5', 'severe']) {
    assert.throws(() => parseSymptomForm(form({ name: 'Headache', when, severity })));
  }
});

test('measurements reject malformed numbers and preserve a valid blood pressure pair', () => {
  const fields = { name: 'Temperature', unit: '°C', pinned: false };
  for (const value of ['NaN', 'Infinity', '36 degrees', '']) {
    assert.throws(() => parseMeasurementForm(form({ value, when }), fields));
  }
  assert.equal(parseMeasurementForm(form({ value: '36.70', when }), fields).value, '36.7');
  assert.equal(parseMeasurementForm(form({ systolic: '120', diastolic: '80', when }), { ...fields, name: 'Blood pressure', unit: 'mmHg' }).value, '120/80');
  assert.throws(() => parseMeasurementForm(form({ systolic: '-1', diastolic: '80', when }), { ...fields, name: 'Blood pressure' }));
});

test('reports require a supported nonempty file and valid date', () => {
  const data = form({ date: '2026-09-07' });
  assert.throws(() => parseReportForm(data, null));
  assert.throws(() => parseReportForm(data, new File([], 'empty.pdf', { type: 'application/pdf' })));
  assert.throws(() => parseReportForm(data, new File(['html'], 'report.html', { type: 'text/html' })));
  const file = new File(['example'], 'report.pdf', { type: 'application/pdf' });
  assert.equal(parseReportForm(data, file).file, file);
});
