'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import { useEmotionCache } from '@chakra-ui/next-js/use-emotion-cache';
import { queryClient } from '@/lib/react-query';
import { UserSessionProvider } from '@/features/UserSession/user-session-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const emotionCache = useEmotionCache();

  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider>
        <QueryClientProvider client={queryClient}>
          <UserSessionProvider>{children}</UserSessionProvider>
        </QueryClientProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
