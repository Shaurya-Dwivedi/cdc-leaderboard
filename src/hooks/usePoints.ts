import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient, type AuditLogFilters } from '../api/client';
import type { AwardPointsInput, BulkAwardInput } from '../types';
import { toast } from 'sonner';

export function useAwardPoints() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: AwardPointsInput) => getApiClient().awardPoints(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['auditLog'] });
      toast.success('Points awarded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to award points: ${error.message}`);
    },
  });
}

export function useBulkAwardPoints() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkAwardInput) => getApiClient().bulkAwardPoints(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['auditLog'] });
      toast.success(`Points awarded to ${variables.memberIds.length} members`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to award points: ${error.message}`);
    },
  });
}

export function useRevertEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => getApiClient().revertEntry(entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['auditLog'] });
      toast.success('Entry reverted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to revert: ${error.message}`);
    },
  });
}

export function useAuditLog(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['auditLog', filters],
    queryFn: () => getApiClient().getAuditLog(filters),
  });
}

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => getApiClient().getActivity(),
    refetchInterval: 30_000,
  });
}

export function useCloseWeek() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (weekId: string) => getApiClient().closeWeek(weekId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentWeek'] });
      qc.invalidateQueries({ queryKey: ['weeks'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['rewards'] });
      toast.success('Week finalized and closed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to close week: ${error.message}`);
    },
  });
}

export function useReopenWeek() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ weekId, reason }: { weekId: string; reason: string }) =>
      getApiClient().reopenWeek(weekId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentWeek'] });
      qc.invalidateQueries({ queryKey: ['weeks'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['auditLog'] });
      toast.success('Week reopened for late adjustments');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reopen week: ${error.message}`);
    },
  });
}

