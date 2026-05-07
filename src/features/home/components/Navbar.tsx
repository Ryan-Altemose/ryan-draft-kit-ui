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
import NavbarButton from '@/shared/components/ui/NavbarButton';
import Link from 'next/link';
import GoogleSignInButton from '@/features/Auth/components/GoogleSignInButton';
import { useUserSession } from '@/features/UserSession/user-session-provider';

export default function Navbar() {
  const { currentUser, signOutUser, status } = useUserSession();
  const isAuthenticated = status === 'ready' && Boolean(currentUser);

  return (
    <Box px={6} py={3} borderBottomWidth="2px" borderColor="green.600">
      <Flex align="center">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" boxSize="70px" cursor="pointer" />
        </Link>

        <Heading size="lg" color="green.600" ml={4} fontFamily="heading">
          War Room Intel
        </Heading>

        <Spacer />

        <Flex gap={3}>
          <NavbarButton label="Stats" href="/stats" />
          <NavbarButton label="Projections" href="/projections" />
          {isAuthenticated ? (
            <>
              <NavbarButton label="My Leagues" href="/leagues" />
              <NavbarButton label="Notebook" href="/notebook" />
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
