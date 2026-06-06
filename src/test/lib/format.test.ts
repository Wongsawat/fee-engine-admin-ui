import { formatRelativeTime } from '@/lib/format';

const FIXED = new Date('2026-06-06T12:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('formatRelativeTime', () => {
  it('returns "30 seconds ago" for 30s in the past', () => {
    const date = new Date(FIXED - 30_000).toISOString();
    expect(formatRelativeTime(date)).toBe('30 seconds ago');
  });

  it('returns "5 minutes ago" for 5m in the past', () => {
    const date = new Date(FIXED - 5 * 60_000).toISOString();
    expect(formatRelativeTime(date)).toBe('5 minutes ago');
  });

  it('returns "2 hours ago" for 2h in the past', () => {
    const date = new Date(FIXED - 2 * 3_600_000).toISOString();
    expect(formatRelativeTime(date)).toBe('2 hours ago');
  });

  it('returns "3 days ago" for 3d in the past', () => {
    const date = new Date(FIXED - 3 * 86_400_000).toISOString();
    expect(formatRelativeTime(date)).toBe('3 days ago');
  });

  it('returns "in 1 minute" for 60s in the future', () => {
    const date = new Date(FIXED + 65_000).toISOString();
    expect(formatRelativeTime(date)).toBe('in 1 minute');
  });

  it('falls back to the raw string for invalid input', () => {
    expect(formatRelativeTime('not-a-date')).toBe('not-a-date');
  });
});
