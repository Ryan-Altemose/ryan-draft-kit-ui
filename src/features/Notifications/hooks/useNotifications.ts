import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { NotificationsResponse } from '../types/notifications.types';
import { fetchNotifications } from '../utils/fetchNotifications';

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: [QUERY_KEYS.NOTIFICATIONS],
    queryFn: fetchNotifications,
  });
}
