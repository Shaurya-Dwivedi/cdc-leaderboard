import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../api/client';
import { useState, useEffect } from 'react';

export function useWeeks() {
  return useQuery({
    queryKey: ['weeks'],
    queryFn: () => getApiClient().getWeeks(),
  });
}

export function useCurrentWeek() {
  const [serverOffset, setServerOffset] = useState(0);

  const query = useQuery({
    queryKey: ['currentWeek'],
    queryFn: () => getApiClient().getCurrentWeek(),
    // Every minute; every 5s once the week has ended, until the scheduler opens the next one.
    refetchInterval: (q) =>
      q.state.data && new Date(q.state.data.week.endAt).getTime() <= Date.now() + serverOffset
        ? 5_000
        : 60_000,
  });

  useEffect(() => {
    if (query.data) {
      const serverTime = new Date(query.data.serverNow).getTime();
      const clientTime = Date.now();
      setServerOffset(serverTime - clientTime);
    }
  }, [query.data]);

  return { ...query, serverOffset };
}
