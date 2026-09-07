import type { Report } from '../types';

export function downloadReport(report: Report): void {
  const url = URL.createObjectURL(report.file);
  const link = document.createElement('a');
  link.href = url;
  link.download = report.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
