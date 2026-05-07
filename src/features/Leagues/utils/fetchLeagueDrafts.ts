import { apiClient } from '@/shared/utils/api-client';
import type { LeagueDraftsResponse } from '../types/leagueDrafts.types';

export async function fetchLeagueDrafts(
  leagueId: string,
): Promise<LeagueDraftsResponse> {
  return apiClient.get(`/api/leagues/${leagueId}/drafts`);
}
