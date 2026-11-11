import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../api/client';
import { toast } from 'sonner';

export function useRewards(weekId?: string) {
  return useQuery({
    queryKey: ['rewards', weekId],
    queryFn: () => getApiClient().getRewards(weekId),
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
