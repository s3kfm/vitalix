export function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export function localDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function timeLabel(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return 'Time not set';
  const hours = Number(value.slice(0, 2));
  const minutes = Number(value.slice(3, 5));
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}
