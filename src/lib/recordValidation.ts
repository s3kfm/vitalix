import type {
  DoseStatus,
  Medicine,
  NewDoseLog,
  NewMeasurement,
  NewMedicine,
  NewReport,
  NewSymptomEntry,
} from '../types';

/** FormData is untrusted at this boundary, even when HTML constraints are present. */
function textField(data: FormData, key: string, label: string, required = false): string {
  const raw = data.get(key);
  if (raw !== null && typeof raw !== 'string') {
    throw new Error(`${label} must be text.`);
  }
  const value = (raw ?? '').trim();
  if (required && !value) throw new Error(`Enter ${label.toLowerCase()}.`);
  return value;
}

function dateTime(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error(`Enter a valid ${label.toLowerCase()}.`);
  }
  const date = new Date(value);
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  if (
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year || date.getMonth() + 1 !== month ||
    date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute
  ) {
    throw new Error(`Enter a valid ${label.toLowerCase()}.`);
  }
  return date.toISOString();
}

function numericReading(value: string, label: string): number {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value))) {
    throw new Error(`${label} must be a number.`);
  }
  return Number(value);
}

function doseStatus(value: string): DoseStatus {
  if (value === 'Taken' || value === 'Skipped') return value;
  throw new Error('Choose Taken or Skipped.');
}

export function parseMedicineForm(data: FormData, scheduled: boolean): NewMedicine {
  const schedule: string[] = [];
  if (scheduled) {
    const time = textField(data, 'time', 'Time', true);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Enter a valid schedule time.');
    schedule.push(time);
  }
  return {
    name: textField(data, 'name', 'Medication name', true),
    strength: textField(data, 'strength', 'Strength'),
    dose: textField(data, 'dose', 'Usual dose', true),
    schedule,
    notes: textField(data, 'notes', 'Notes'),
    active: true,
  };
}

export function parseDoseForm(data: FormData, medicine: Medicine, scheduledTime?: string): NewDoseLog {
  return {
    medicineId: medicine.id,
    name: [medicine.name, medicine.strength].filter(Boolean).join(' '),
    dose: textField(data, 'dose', 'Dose', true),
    takenAt: dateTime(textField(data, 'when', 'Date and time', true), 'Date and time'),
    status: doseStatus(textField(data, 'status', 'Status', true)),
    scheduledTime,
    notes: textField(data, 'notes', 'Notes'),
  };
}

interface MeasurementFields {
  name: string;
  unit: string;
  pinned: boolean;
}

export function parseMeasurementForm(data: FormData, fields: MeasurementFields): NewMeasurement {
  const name = fields.name.trim();
  if (!name) throw new Error('Enter a measurement name.');
  let value: string;
  if (name === 'Blood pressure') {
    const systolic = numericReading(textField(data, 'systolic', 'Systolic', true), 'Systolic');
    const diastolic = numericReading(textField(data, 'diastolic', 'Diastolic', true), 'Diastolic');
    if (![systolic, diastolic].every(n => Number.isInteger(n) && n > 0)) {
      throw new Error('Blood pressure readings must be positive whole numbers.');
    }
    value = `${systolic}/${diastolic}`;
  } else {
    value = String(numericReading(textField(data, 'value', 'Value', true), 'Value'));
  }
  return {
    name,
    value,
    unit: fields.unit.trim(),
    pinned: fields.pinned,
    recordedAt: dateTime(textField(data, 'when', 'Date and time', true), 'Date and time'),
    notes: textField(data, 'notes', 'Notes'),
  };
}

export function parseSymptomForm(data: FormData): NewSymptomEntry {
  const rawSeverity = textField(data, 'severity', 'Severity');
  const severity = rawSeverity === '' ? null : numericReading(rawSeverity, 'Severity');
  if (severity !== null && (!Number.isInteger(severity) || severity < 1 || severity > 10)) {
    throw new Error('Choose a severity from 1 to 10, or leave it unspecified.');
  }
  return {
    name: textField(data, 'name', 'Symptom', true),
    recordedAt: dateTime(textField(data, 'when', 'Date and time', true), 'Date and time'),
    severity,
    location: textField(data, 'location', 'Location'),
    notes: textField(data, 'notes', 'Notes'),
    ongoing: data.get('ongoing') === 'on',
  };
}

export function validateReportFile(file: File): void {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const allowedExtension = /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!allowedExtension || (file.type && !allowedTypes.includes(file.type))) {
    throw new Error('Choose a PDF, JPG, PNG, WebP, or HEIC image.');
  }
  if (!file.size) throw new Error('This file is empty. Choose another report.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Choose a report smaller than 20 MB.');
}

export function parseReportForm(data: FormData, file: File | null): NewReport {
  if (!file) throw new Error('Choose a report.');
  validateReportFile(file);
  return {
    name: file.name,
    file,
    recordedAt: dateTime(`${textField(data, 'date', 'Report date', true)}T12:00`, 'Report date'),
  };
}
