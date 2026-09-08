/** Stub types for demo — not connected to a live database. */

export type MeasurementResult = {
  type: 'quantity' | 'coded' | 'absent' | 'range' | 'ratio' | 'sampledData' | 'period' | 'string' | 'time' | 'dateTime' | 'boolean' | 'integer';
  value: unknown;
};