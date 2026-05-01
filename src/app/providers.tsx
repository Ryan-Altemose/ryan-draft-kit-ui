'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { queryClient } from '@/lib/react-query';
import { UserSessionProvider } from '@/features/UserSession/user-session-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <UserSessionProvider>{children}</UserSessionProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
