import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../api/client';

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => getApiClient().getMembers(),
    staleTime: 5 * 60 * 1000, // members don't change often
  });
}
