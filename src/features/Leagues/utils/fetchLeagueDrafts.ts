import { localApiClient } from '@/shared/utils/api-client';
import type { LeagueDraftsResponse } from '../types/leagueDrafts.types';

type FetchLeagueDraftsOptions = {
  endpointBase?: '/api/leagues' | '/api/draft-save/leagues';
};

export async function fetchLeagueDrafts(
  leagueId: string,
  options?: FetchLeagueDraftsOptions,
): Promise<LeagueDraftsResponse> {
  return localApiClient.get(
    `${options?.endpointBase ?? '/api/leagues'}/${leagueId}/drafts`,
  );
}
