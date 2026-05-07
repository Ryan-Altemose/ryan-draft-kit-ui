import { apiClient } from '@/shared/utils/api-client';
import type { LeagueDraftResponse } from '../types/leagueDrafts.types';

export async function fetchLeagueDraftById(
  leagueId: string,
  draftId: string,
): Promise<LeagueDraftResponse> {
  return apiClient.get(`/api/leagues/${leagueId}/drafts/${draftId}`);
}
