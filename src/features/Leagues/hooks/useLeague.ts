import { useQuery } from '@tanstack/react-query';
import { fetchLeagueById } from '../utils/fetchLeagueById';
import type { LeagueResponse } from '../types/leagues.types';

type UseLeagueOptions = {
  endpointBase?: '/api/leagues' | '/api/draft-save/leagues';
  queryKeyPrefix?: string;
};

export function useLeague(leagueId?: string, options?: UseLeagueOptions) {
  return useQuery<LeagueResponse>({
    queryKey: [options?.queryKeyPrefix ?? 'league', leagueId],
    queryFn: () =>
      fetchLeagueById(leagueId as string, {
        endpointBase: options?.endpointBase,
      }),
    enabled: Boolean(leagueId),
  });
}
