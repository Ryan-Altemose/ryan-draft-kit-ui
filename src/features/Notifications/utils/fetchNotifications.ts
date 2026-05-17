import type { NotificationsResponse } from '../types/notifications.types';
import { localApiClient } from '@/shared/utils/api-client';

export async function fetchNotifications(): Promise<NotificationsResponse> {
  return localApiClient.get<NotificationsResponse>('/api/notifications', {
    cache: 'no-store',
  });
}
