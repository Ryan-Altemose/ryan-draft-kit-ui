'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { signIn, signOut } from 'next-auth/react';
import { queryClient } from '@/lib/react-query';
import { ERROR_MESSAGES, QUERY_KEYS } from '@/shared/constants';
import { bootstrapCurrentUser } from './user-session';
import type {
  CurrentUser,
  UserSessionStatus,
} from './types/user-session.types';
import { setBackendUnauthorizedHandler } from '@/shared/utils/api-client';

type UserSessionContextValue = {
  currentUser: CurrentUser | null;
  status: UserSessionStatus;
  errorMessage: string | null;
  reinitialize: () => Promise<void>;
  signInWithGoogle: (callbackUrl?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

function clearUserOwnedQueries(): void {
  queryClient.removeQueries({ queryKey: [QUERY_KEYS.LEAGUES] });
  queryClient.removeQueries({ queryKey: [QUERY_KEYS.LEAGUE] });
  queryClient.removeQueries({ queryKey: [QUERY_KEYS.NOTEBOOKS] });
  queryClient.removeQueries({ queryKey: [QUERY_KEYS.NOTEBOOK] });
  queryClient.removeQueries({ queryKey: [QUERY_KEYS.CURRENT_USER_PROFILE] });
}

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<UserSessionStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);

  const initialize = useCallback(async () => {
    if (bootstrapPromiseRef.current) {
      return bootstrapPromiseRef.current;
    }

    setStatus('initializing');
    setErrorMessage(null);

    const previousUserId = currentUserIdRef.current;

    const bootstrapPromise = bootstrapCurrentUser()
      .then((user) => {
        if (previousUserId && previousUserId !== user?.userId) {
          clearUserOwnedQueries();
        }

        currentUserIdRef.current = user?.userId ?? null;
        setCurrentUser(user);
        setStatus(user ? 'ready' : 'unauthenticated');
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.USER_BOOTSTRAP;
        setCurrentUser(null);
        setStatus('error');
        setErrorMessage(message);
        throw error;
      })
      .finally(() => {
        bootstrapPromiseRef.current = null;
      });

    bootstrapPromiseRef.current = bootstrapPromise;

    return bootstrapPromise;
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setBackendUnauthorizedHandler(() => {
      currentUserIdRef.current = null;
      clearUserOwnedQueries();
      setCurrentUser(null);
      setStatus('unauthenticated');
      void signOut({ callbackUrl: '/login' });
    });

    return () => {
      setBackendUnauthorizedHandler(null);
    };
  }, [initialize]);

  const signOutUser = useCallback(async () => {
    currentUserIdRef.current = null;
    clearUserOwnedQueries();
    setCurrentUser(null);
    setStatus('unauthenticated');
    await signOut({ callbackUrl: '/' });
  }, []);

  const signInWithGoogle = useCallback(async (callbackUrl?: string) => {
    await signIn('google', { callbackUrl: callbackUrl ?? '/' });
  }, []);

  const value = useMemo<UserSessionContextValue>(
    () => ({
      currentUser,
      status,
      errorMessage,
      reinitialize: initialize,
      signInWithGoogle,
      signOutUser,
    }),
    [
      currentUser,
      errorMessage,
      initialize,
      signInWithGoogle,
      signOutUser,
      status,
    ],
  );

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession(): UserSessionContextValue {
  const context = useContext(UserSessionContext);

  if (!context) {
    throw new Error('useUserSession must be used within UserSessionProvider');
  }

  return context;
}
