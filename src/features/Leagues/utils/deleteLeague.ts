import { localApiClient } from '@/shared/utils/api-client';
import type { LeagueResponse } from '../types/leagues.types';

type DeleteLeagueOptions = {
  endpoint?: '/api/leagues' | '/api/draft-save/leagues';
};

export async function deleteLeague(
  id: string,
  options?: DeleteLeagueOptions,
): Promise<LeagueResponse> {
  return localApiClient.delete<LeagueResponse>(
    `${options?.endpoint ?? '/api/leagues'}/${id}`,
  );
}
