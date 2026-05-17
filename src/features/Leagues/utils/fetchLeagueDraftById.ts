import { localApiClient } from '@/shared/utils/api-client';
import type { LeagueDraftResponse } from '../types/leagueDrafts.types';

export async function fetchLeagueDraftById(
  leagueId: string,
  draftId: string,
): Promise<LeagueDraftResponse> {
  return localApiClient.get(`/api/leagues/${leagueId}/drafts/${draftId}`);
}
