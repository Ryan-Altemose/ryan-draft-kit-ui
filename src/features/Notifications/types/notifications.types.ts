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

export type NotificationArchiveResult = {
  archived: boolean;
  archivedCount: number;
  status?: number;
  message?: string;
};

export type NotificationPushResponse = {
  success: boolean;
  data?: {
    pushed: boolean;
    clients: number;
    type: string;
    archive?: NotificationArchiveResult;
  };
  message?: string;
};

export type NotificationsResponse = {
  success: boolean;
  data: Notification[];
};

export type NotificationsErrorResponse = {
  success: false;
  message: string;
  debug?: {
    endpoint?: string;
    upstreamUrl?: string;
    upstreamStatus?: number;
  };
};
