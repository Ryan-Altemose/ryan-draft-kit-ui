'use client';

import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Spacer,
  Text,
} from '@chakra-ui/react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import NavbarButton from '@/shared/components/ui/NavbarButton';
import Link from 'next/link';
import GoogleSignInButton from '@/features/Auth/components/GoogleSignInButton';
import { useNotifications } from '@/features/Notifications/hooks/useNotifications';
import { useUserSession } from '@/features/UserSession/user-session-provider';
import { QUERY_KEYS } from '@/shared/constants';
import { useNotificationCenter } from '@/shared/hooks/useNotificationCenter';

export default function Navbar() {
  const { currentUser, signOutUser, status } = useUserSession();
  const isAuthenticated = status === 'ready' && Boolean(currentUser);
  const queryClient = useQueryClient();
  const { lastEvent } = useNotificationCenter();
  const notificationsQuery = useNotifications({ enabled: isAuthenticated });
  const hasUnreadNotifications =
    (notificationsQuery.data?.data?.length ?? 0) > 0;

  useEffect(() => {
    if (!isAuthenticated || !lastEvent) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.NOTIFICATIONS],
    });
  }, [isAuthenticated, lastEvent, queryClient]);

  return (
    <Box px={6} py={3} borderBottomWidth="2px" borderColor="green.600">
      <Flex align="center">
        <Link href="/">
          <Image
            src="/larger_logo.png"
            alt="Logo"
            boxSize="70px"
            cursor="pointer"
          />
        </Link>

        <Heading size="lg" color="green.600" ml={4} fontFamily="heading">
          War Room Intel
        </Heading>

        <Spacer />

        <Flex gap={3}>
          <NavbarButton label="Stats" href="/stats" />
          {isAuthenticated ? (
            <>
              <NavbarButton label="My Leagues" href="/leagues" />
              <NavbarButton label="Notebook" href="/notebook" />
              <NavbarButton
                label="Notifications"
                href="/notifications"
                showIndicator={hasUnreadNotifications}
              />
              <NavbarButton label="Profile" href="/profile" />
              <Text alignSelf="center" color="green.700" fontSize="sm">
                {currentUser?.name}
              </Text>
              <Button
                variant="outline"
                colorScheme="green"
                onClick={() => {
                  void signOutUser();
                }}
              >
                Sign Out
              </Button>
            </>
          ) : status === 'initializing' ? (
            <Text alignSelf="center" color="green.700" fontSize="sm">
              Loading account
            </Text>
          ) : (
            <GoogleSignInButton label="Sign In" />
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
