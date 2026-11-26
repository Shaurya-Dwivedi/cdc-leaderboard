import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiClient } from '../api/client';

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => getApiClient().getMembers(),
    staleTime: 5 * 60 * 1000, // members don't change often
  });
}

export function useAddMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => getApiClient().addMember(name),
    onSuccess: (member) => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success(`${member.name} added`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add member: ${error.message}`);
    },
  });
}
