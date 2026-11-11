import { CONFIG } from '../config';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export interface WeekBoundary {
  start: Date;
  end: Date;
}

/**
 * Get the week boundary (Monday 00:00:00 to Sunday 23:59:59) containing the given date
 * in the configured timezone.
 */
export function getWeekBoundary(date: Date): WeekBoundary {
  // Work in UTC but compute "local" day-of-week in Asia/Kolkata (UTC+5:30)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const localMs = date.getTime() + IST_OFFSET_MS;
  const localDate = new Date(localMs);

  // getUTCDay: 0=Sun, 1=Mon ... 6=Sat
  const dow = localDate.getUTCDay();
  // Days since Monday (Mon=0, Tue=1, ... Sun=6)
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;

  // Start: Monday 00:00:00 IST
  const startLocal = new Date(localDate);
  startLocal.setUTCHours(0, 0, 0, 0);
  startLocal.setUTCDate(startLocal.getUTCDate() - daysSinceMonday);
  const start = new Date(startLocal.getTime() - IST_OFFSET_MS);

  // End: Sunday 23:59:59.999 IST
  const endLocal = new Date(startLocal);
  endLocal.setUTCDate(startLocal.getUTCDate() + 6);
  endLocal.setUTCHours(23, 59, 59, 999);
  const end = new Date(endLocal.getTime() - IST_OFFSET_MS);

  return { start, end };
}

/**
 * Get the current week boundary.
 */
export function getCurrentWeekBoundary(): WeekBoundary {
  return getWeekBoundary(new Date());
}

/**
 * Calculate time remaining until a target ISO timestamp, accounting for server time offset.
 * @param endAt ISO date string for when the week ends
 * @param serverOffsetMs Difference between server time and client time (serverTime - clientTime)
 */
export function getTimeRemaining(endAt: string, serverOffsetMs: number): TimeRemaining {
  const now = Date.now() + serverOffsetMs;
  const end = new Date(endAt).getTime();
  const totalMs = Math.max(0, end - now);

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, totalMs };
}

/**
 * Check if the remaining time is in the urgency window (last 24 hours).
 */
export function isUrgent(remaining: TimeRemaining): boolean {
  return remaining.totalMs > 0 && remaining.totalMs <= CONFIG.URGENCY_THRESHOLD_MS;
}

/**
 * Format a date range for display: "Nov 4 – Nov 10, 2024"
 */
export function formatWeekRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const sameMonth = start.getMonth() === end.getMonth();
  const startFmt = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const endFmt = end.toLocaleDateString('en-IN', {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startFmt} – ${endFmt}`;
}
