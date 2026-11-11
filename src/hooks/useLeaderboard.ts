import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../api/client';
import { CONFIG } from '../config';
import type { LeaderboardScope } from '../types';

export function useLeaderboard(scope: LeaderboardScope, weekId?: string) {
  return useQuery({
    queryKey: ['leaderboard', scope, weekId],
    queryFn: () => getApiClient().getLeaderboard(scope, weekId),
    refetchInterval: CONFIG.POLL_INTERVAL_MS,
  });
}
