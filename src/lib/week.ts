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

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffsetMs(date: Date, tz: string): number {
  const p: Record<string, number> = {};
  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date)) {
    if (part.type !== 'literal') p[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Real instant for a wall-clock time in `tz` (wall time passed as if it were UTC ms). */
function fromWallClock(wallMs: number, tz: string): Date {
  const guess = wallMs - tzOffsetMs(new Date(wallMs), tz);
  return new Date(wallMs - tzOffsetMs(new Date(guess), tz));
}

/**
 * Get the week boundary (Monday 00:00:00 to Sunday 23:59:59.999) containing the given date
 * in CONFIG.TIMEZONE.
 */
export function getWeekBoundary(date: Date, tz: string = CONFIG.TIMEZONE): WeekBoundary {
  const wall = new Date(date.getTime() + tzOffsetMs(date, tz));
  // getUTCDay on the wall-clock value: 0=Sun ... 6=Sat; days since Monday (Mon=0 ... Sun=6)
  const dow = wall.getUTCDay();
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;

  const mondayWall = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() - daysSinceMonday);
  const start = fromWallClock(mondayWall, tz);
  const end = new Date(fromWallClock(mondayWall + 7 * 24 * 60 * 60 * 1000, tz).getTime() - 1);

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
