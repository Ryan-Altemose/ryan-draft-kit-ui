'use client';

import type { BaseEntity } from '@/shared/types/api';

export type Notification = BaseEntity & {
  userId?: string;
  type: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
};

export type NotificationResponse = {
  success: boolean;
  data: Notification;
};

export type NotificationsResponse = {
  success: boolean;
  data: Notification[];
};
