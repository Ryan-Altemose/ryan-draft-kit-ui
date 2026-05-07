import { useQuery } from '@tanstack/react-query';
import { fetchLeagueDrafts } from '../utils/fetchLeagueDrafts';
import type { LeagueDraftsResponse } from '../types/leagueDrafts.types';

export function useLeagueDrafts(leagueId?: string) {
  return useQuery<LeagueDraftsResponse>({
    queryKey: ['league-drafts', leagueId],
    queryFn: () => fetchLeagueDrafts(leagueId as string),
    enabled: Boolean(leagueId),
  });
}
