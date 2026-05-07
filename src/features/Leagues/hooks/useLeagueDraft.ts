import { useQuery } from '@tanstack/react-query';
import { fetchLeagueDraftById } from '../utils/fetchLeagueDraftById';
import type { LeagueDraftResponse } from '../types/leagueDrafts.types';

export function useLeagueDraft(leagueId?: string, draftId?: string) {
  return useQuery<LeagueDraftResponse>({
    queryKey: ['league-draft', leagueId, draftId],
    queryFn: () => fetchLeagueDraftById(leagueId as string, draftId as string),
    enabled: Boolean(leagueId) && Boolean(draftId),
  });
}
