'use client';

import { localApiClient } from '@/shared/utils/api-client';
import type { CurrentUser } from './types/user-session.types';

type UserResponse = {
  success: boolean;
  authenticated: boolean;
  data: CurrentUser | null;
};

export async function bootstrapCurrentUser(): Promise<CurrentUser | null> {
  const response = await localApiClient.get<UserResponse>('/api/session');
  return response.data;
}
