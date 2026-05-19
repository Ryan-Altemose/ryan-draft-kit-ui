import { localApiClient } from '@/shared/utils/api-client';
import type { LeagueResponse } from '../types/leagues.types';

export async function importLeague(
  importJson: unknown,
): Promise<LeagueResponse> {
  return localApiClient.post<LeagueResponse>('/api/draft-save/leagues/import', {
    importJson,
  });
}
