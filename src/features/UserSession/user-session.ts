'use client';

import { ERROR_MESSAGES, STORAGE_KEYS } from '@/shared/constants';
import { storage } from '@/shared/utils/storage';
import { localApiClient } from '@/shared/utils/api-client';
import type { CurrentUser } from './types/user-session.types';
import {
  getStoredExternalUserId,
  getStoredUserName,
  persistCurrentUser,
} from './user-session-storage';

type UserRecord = {
  _id: string;
  name: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
};

type UserResponse = {
  success: boolean;
  data: UserRecord;
};

function createExternalUserId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `draftkit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await localApiClient.get<UserResponse>('/api/users/me');

  return {
    userId: response.data._id,
    externalId: response.data.externalId ?? '',
    name: response.data.name,
  };
}

export async function bootstrapCurrentUser(): Promise<CurrentUser> {
  const existingExternalId = getStoredExternalUserId();
  const externalId = existingExternalId ?? createExternalUserId();
  const name = getStoredUserName();

  if (!existingExternalId) {
    storage.set(STORAGE_KEYS.EXTERNAL_USER_ID, externalId);
  }

  const response = await localApiClient.post<UserResponse>('/api/users', {
    name,
    externalId,
  });

  const user = response.data;

  if (!user._id) {
    throw new Error(ERROR_MESSAGES.USER_BOOTSTRAP);
  }

  const currentUser: CurrentUser = {
    userId: user._id,
    externalId: user.externalId ?? externalId,
    name: user.name,
  };

  persistCurrentUser(currentUser);

  return currentUser;
}
