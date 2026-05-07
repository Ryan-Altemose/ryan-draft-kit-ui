import { localApiClient } from '@/shared/utils/api-client';
import type { LeagueResponse } from '../types/leagues.types';

type FetchLeagueByIdOptions = {
  endpointBase?: '/api/leagues' | '/api/draft-save/leagues';
};

export async function fetchLeagueById(
  id: string,
  options?: FetchLeagueByIdOptions,
): Promise<LeagueResponse> {
  return localApiClient.get<LeagueResponse>(
    `${options?.endpointBase ?? '/api/leagues'}/${id}`,
  );
}
