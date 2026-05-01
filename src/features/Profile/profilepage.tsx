'use client';

import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useUserSession } from '@/features/UserSession/user-session-provider';
import { isApiError } from '@/shared/utils/api-client';
import { useCurrentUserProfile } from './hooks/useCurrentUserProfile';

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <Box>
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontFamily="mono" fontSize="sm">
        {value || '-'}
      </Text>
    </Box>
  );
}

export default function ProfilePage() {
  const { currentUser, reinitialize, rotateAccount } = useUserSession();
  const userProfileQuery = useCurrentUserProfile(currentUser?.userId);
  const profile = userProfileQuery.data?.data;
  const errorMessage = userProfileQuery.error
    ? isApiError(userProfileQuery.error)
      ? userProfileQuery.error.message
      : 'Unable to load backend user profile.'
    : null;

  return (
    <Box p={8}>
      <Stack spacing={6}>
        <HStack justify="space-between" align="center">
          <Heading>Profile</Heading>
          <HStack>
            <Button
              variant="outline"
              onClick={() => {
                void userProfileQuery.refetch();
              }}
              isLoading={userProfileQuery.isFetching}
            >
              Refresh
            </Button>
            <Button
              onClick={() => {
                void reinitialize();
              }}
            >
              Reinitialize Session
            </Button>
            <Button
              colorScheme="orange"
              onClick={() => {
                void rotateAccount();
              }}
            >
              Rotate Account
            </Button>
          </HStack>
        </HStack>

        <Box borderWidth="1px" borderRadius="md" p={5}>
          <Stack spacing={4}>
            <Heading size="md">Session</Heading>
            <ProfileField label="User ID" value={currentUser?.userId} />
            <ProfileField label="External ID" value={currentUser?.externalId} />
            <ProfileField label="Name" value={currentUser?.name} />
          </Stack>
        </Box>

        <Box borderWidth="1px" borderRadius="md" p={5}>
          <Stack spacing={4}>
            <Heading size="md">Backend User</Heading>
            {userProfileQuery.isLoading ? <Spinner /> : null}
            {errorMessage ? <Text color="red.500">{errorMessage}</Text> : null}
            {profile ? (
              <>
                <ProfileField label="_id" value={profile._id} />
                <ProfileField label="name" value={profile.name} />
                <ProfileField label="externalId" value={profile.externalId} />
                <Divider />
                <ProfileField label="createdAt" value={profile.createdAt} />
                <ProfileField label="updatedAt" value={profile.updatedAt} />
              </>
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
