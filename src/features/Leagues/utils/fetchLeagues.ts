import { localApiClient } from '@/shared/utils/api-client';
import { LeaguesResponse } from '../types/leagues.types';

type FetchLeaguesOptions = {
  endpoint?: '/api/leagues' | '/api/draft-save/leagues';
};

export async function fetchLeagues(
  options?: FetchLeaguesOptions,
): Promise<LeaguesResponse> {
  return localApiClient.get<LeaguesResponse>(
    options?.endpoint ?? '/api/leagues',
  );
}
