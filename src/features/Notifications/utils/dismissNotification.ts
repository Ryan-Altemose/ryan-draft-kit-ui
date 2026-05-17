import type { NotificationResponse } from '../types/notifications.types';
import { localApiClient } from '@/shared/utils/api-client';

export async function dismissNotification(
  id: string,
): Promise<NotificationResponse> {
  return localApiClient.delete<NotificationResponse>(
    `/api/notifications/${id}`,
  );
}
