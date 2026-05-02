import { useQuery } from '@tanstack/react-query';
import { fetchLeagues } from '../utils/fetchLeagues';
import { LeaguesResponse } from '../types/leagues.types';

type UseLeaguesOptions = {
  endpoint?: '/api/leagues' | '/api/draft-save/leagues';
  queryKey?: string[];
};

export function useLeagues(options?: UseLeaguesOptions) {
  return useQuery<LeaguesResponse>({
    queryKey: options?.queryKey ?? ['leagues'],
    queryFn: () => fetchLeagues({ endpoint: options?.endpoint }),
  });
}
