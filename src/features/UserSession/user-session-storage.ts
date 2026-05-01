'use client';

import { STORAGE_KEYS } from '@/shared/constants';
import { storage } from '@/shared/utils/storage';
import type { CurrentUser } from './types/user-session.types';

export const DEFAULT_USER_NAME = 'Draft Kit User';

export function getStoredExternalUserId(): string | null {
  return storage.get<string>(STORAGE_KEYS.EXTERNAL_USER_ID);
}

export function getStoredUserId(): string | null {
  return storage.get<string>(STORAGE_KEYS.USER_ID);
}

export function getStoredUserName(): string {
  return storage.get<string>(STORAGE_KEYS.USER_NAME) ?? DEFAULT_USER_NAME;
}

export function getStoredCurrentUser(): CurrentUser | null {
  const userId = getStoredUserId();
  const externalId = getStoredExternalUserId();

  if (!userId || !externalId) {
    return null;
  }

  return {
    userId,
    externalId,
    name: getStoredUserName(),
  };
}

export function persistCurrentUser(user: CurrentUser): void {
  storage.set(STORAGE_KEYS.EXTERNAL_USER_ID, user.externalId);
  storage.set(STORAGE_KEYS.USER_ID, user.userId);
  storage.set(STORAGE_KEYS.USER_NAME, user.name);
}

export function clearStoredBackendUserId(): void {
  storage.remove(STORAGE_KEYS.USER_ID);
}

export function clearStoredCurrentUser(): void {
  storage.remove(STORAGE_KEYS.EXTERNAL_USER_ID);
  storage.remove(STORAGE_KEYS.USER_ID);
  storage.remove(STORAGE_KEYS.USER_NAME);
}
