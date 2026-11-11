import { useState, useEffect, useRef } from 'react';
import { useCurrentWeek } from './useWeeks';
import { getTimeRemaining, isUrgent } from '../lib/week';
import type { TimeRemaining } from '../lib/week';

export interface CountdownState extends TimeRemaining {
  isUrgent: boolean;
  isExpired: boolean;
}

export function useCountdown(): CountdownState & { weekEndAt: string | null } {
  const { data, serverOffset } = useCurrentWeek();
  const [remaining, setRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const weekEndAt = data?.week.endAt ?? null;

  useEffect(() => {
    if (!weekEndAt) return;

    const tick = () => {
      const r = getTimeRemaining(weekEndAt, serverOffset);
      setRemaining(r);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [weekEndAt, serverOffset]);

  return {
    ...remaining,
    isUrgent: isUrgent(remaining),
    isExpired: remaining.totalMs <= 0,
    weekEndAt,
  };
}
