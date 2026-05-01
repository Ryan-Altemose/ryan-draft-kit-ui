import { localApiClient } from '@/shared/utils/api-client';
import type { UserProfileResponse } from '../types/profile.types';

export async function fetchCurrentUserProfile(): Promise<UserProfileResponse> {
  return localApiClient.get<UserProfileResponse>('/api/users/me');
}
