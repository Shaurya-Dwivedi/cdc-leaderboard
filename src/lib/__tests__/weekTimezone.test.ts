import { describe, it, expect } from 'vitest';
import { getWeekBoundary } from '../week';

describe('getWeekBoundary timezone', () => {
  it('uses the given timezone (New York, EST = UTC-5)', () => {
    // Wed Jan 14 2026 12:00 UTC = 07:00 EST. Week: Mon Jan 12 00:00 EST .. Sun Jan 18 23:59:59.999 EST
    const { start, end } = getWeekBoundary(new Date('2026-01-14T12:00:00Z'), 'America/New_York');
    expect(start.toISOString()).toBe('2026-01-12T05:00:00.000Z');
    expect(end.toISOString()).toBe('2026-01-19T04:59:59.999Z');
  });

  it('defaults to CONFIG.TIMEZONE (Asia/Kolkata, UTC+5:30)', () => {
    const { start } = getWeekBoundary(new Date('2026-01-14T12:00:00Z'));
    expect(start.toISOString()).toBe('2026-01-11T18:30:00.000Z');
  });
});
