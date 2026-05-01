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
import { Box, Button, Spinner, Text, VStack } from '@chakra-ui/react';
import { queryClient } from '@/lib/react-query';
import { ERROR_MESSAGES, QUERY_KEYS } from '@/shared/constants';
import { bootstrapCurrentUser } from './user-session';
import type {
  CurrentUser,
  UserSessionStatus,
} from './types/user-session.types';
import { setBackendUnauthorizedHandler } from '@/shared/utils/api-client';
import {
  clearStoredBackendUserId,
  clearStoredCurrentUser,
  getStoredCurrentUser,
} from './user-session-storage';

type UserSessionContextValue = {
  currentUser: CurrentUser | null;
  status: UserSessionStatus;
  reinitialize: () => Promise<void>;
  rotateAccount: () => Promise<void>;
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
  const initialUser = getStoredCurrentUser();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
    initialUser,
  );
  const [status, setStatus] = useState<UserSessionStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(initialUser?.userId ?? null);
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
        if (previousUserId && previousUserId !== user.userId) {
          clearUserOwnedQueries();
        }

        currentUserIdRef.current = user.userId;
        setCurrentUser(user);
        setStatus('ready');
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
      clearStoredBackendUserId();
      currentUserIdRef.current = null;
      clearUserOwnedQueries();
      void initialize();
    });

    return () => {
      setBackendUnauthorizedHandler(null);
    };
  }, [initialize]);

  const rotateAccount = useCallback(async () => {
    clearStoredCurrentUser();
    currentUserIdRef.current = null;
    clearUserOwnedQueries();
    setCurrentUser(null);
    await initialize();
  }, [initialize]);

  const value = useMemo<UserSessionContextValue>(
    () => ({
      currentUser,
      status,
      reinitialize: initialize,
      rotateAccount,
    }),
    [currentUser, initialize, rotateAccount, status],
  );

  if (status === 'initializing') {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner />
          <Text>Initializing user session.</Text>
        </VStack>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={8}
      >
        <VStack spacing={4} maxW="md" textAlign="center">
          <Text>{errorMessage ?? ERROR_MESSAGES.USER_BOOTSTRAP}</Text>
          <Button onClick={() => void initialize()}>Retry</Button>
        </VStack>
      </Box>
    );
  }

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
