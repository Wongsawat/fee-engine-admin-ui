export function formatRelativeTime(date: string): string {
  const then = new Date(date).getTime();
  if (isNaN(then)) return date;
  const diffMs = Date.now() - then;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, 'hour');
  return rtf.format(-diffDay, 'day');
}
