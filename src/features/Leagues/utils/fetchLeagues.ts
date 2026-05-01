import { localApiClient } from '@/shared/utils/api-client';
import { LeaguesResponse } from '../types/leagues.types';

export async function fetchLeagues(): Promise<LeaguesResponse> {
  return localApiClient.get<LeaguesResponse>('/api/leagues');
}
