import { apiClient } from '@/shared/utils/api-client';
import type { StartNewDraftResponse } from '../types/leagueDrafts.types';

export async function startNewDraft(
  leagueId: string,
  input?: { name?: string },
): Promise<StartNewDraftResponse> {
  return apiClient.post(`/api/leagues/${leagueId}/drafts`, input ?? {});
}
