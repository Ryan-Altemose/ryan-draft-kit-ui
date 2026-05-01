'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { fetchCurrentUserProfile } from '../utils/fetchCurrentUserProfile';

export function useCurrentUserProfile(userId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CURRENT_USER_PROFILE, userId],
    queryFn: fetchCurrentUserProfile,
    enabled: Boolean(userId),
  });
}
