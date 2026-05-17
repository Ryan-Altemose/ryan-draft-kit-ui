import { useQuery } from '@tanstack/react-query';
import { fetchLeagueDrafts } from '../utils/fetchLeagueDrafts';
import type { LeagueDraftsResponse } from '../types/leagueDrafts.types';

type UseLeagueDraftsOptions = {
  endpointBase?: '/api/leagues' | '/api/draft-save/leagues';
  queryKeyPrefix?: string;
};

export function useLeagueDrafts(
  leagueId?: string,
  options?: UseLeagueDraftsOptions,
) {
  return useQuery<LeagueDraftsResponse>({
    queryKey: [options?.queryKeyPrefix ?? 'league-drafts', leagueId],
    queryFn: () =>
      fetchLeagueDrafts(leagueId as string, {
        endpointBase: options?.endpointBase,
      }),
    enabled: Boolean(leagueId),
  });
}
