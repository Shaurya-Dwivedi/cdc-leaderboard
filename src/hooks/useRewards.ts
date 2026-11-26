import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../api/client';
import { toast } from 'sonner';

export function useRewards(weekId?: string) {
  return useQuery({
    queryKey: ['rewards', weekId],
    queryFn: () => getApiClient().getRewards(weekId),
  });
}

export function useRewardTiers() {
  return useQuery({
    queryKey: ['rewardTiers'],
    queryFn: () => getApiClient().getRewardTiers(),
    staleTime: 60_000, // picks up admin edits within a minute
  });
}

export function useMarkRewardDelivered() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) => getApiClient().markRewardDelivered(rewardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards'] });
      toast.success('Reward marked as delivered');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update reward: ${error.message}`);
    },
  });
}

export function useSetRewardTiers() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tiers: { place: number; label: string }[]) => {
      for (const t of tiers) await getApiClient().setRewardTier(t.place, t.label);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewardTiers'] });
      toast.success('Reward tiers updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update reward tiers: ${error.message}`);
    },
  });
}
