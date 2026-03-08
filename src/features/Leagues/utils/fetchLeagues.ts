import { apiClient } from '@/shared/utils/api-client';
import { League } from '../types/leagues.types';

interface LeaguesResponse {
  success: boolean;
  data: League[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchLeagues(): Promise<LeaguesResponse> {
  return apiClient.get<LeaguesResponse>('/api/leagues');
}
