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
    refetchInterval: 60_000, // refresh server time every minute
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
