'use client';

import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { isApiError } from '@/shared/utils/api-client';
import { useNotifications } from './hooks/useNotifications';
import { useDismissNotification } from './hooks/useDismissNotification';
import type { NotificationsErrorResponse } from './types/notifications.types';

function formatTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString();
}

function stripSource(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSource);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'source')
        .map(([key, nestedValue]) => [key, stripSource(nestedValue)]),
    );
  }

  return value;
}

function getRenderableData(
  data: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!data) {
    return null;
  }

  const sanitized = stripSource(data);
  if (
    !sanitized ||
    typeof sanitized !== 'object' ||
    Array.isArray(sanitized) ||
    Object.keys(sanitized).length === 0
  ) {
    return null;
  }

  return sanitized as Record<string, unknown>;
}

function formatNotificationData(
  data: Record<string, unknown> | null | undefined,
): string | null {
  const sanitizedData = getRenderableData(data);

  if (!sanitizedData) {
    return null;
  }

  return JSON.stringify(sanitizedData, null, 2);
}

export default function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const dismissMutation = useDismissNotification();
  const notifications = notificationsQuery.data?.data ?? [];
  const errorPayload =
    isApiError(notificationsQuery.error) &&
    notificationsQuery.error.data &&
    typeof notificationsQuery.error.data === 'object'
      ? (notificationsQuery.error.data as NotificationsErrorResponse)
      : null;

  return (
    <Box maxW="900px" mx="auto" px={6} py={10}>
      <Stack spacing={6}>
        <Box>
          <Heading size="lg">Notifications</Heading>
          <Text mt={2} color="gray.600">
            New notifications are stored here.
          </Text>
        </Box>

        {notificationsQuery.isLoading ? (
          <Flex align="center" gap={3} color="gray.600">
            <Spinner size="sm" />
            <Text>Loading notifications...</Text>
          </Flex>
        ) : null}

        {notificationsQuery.isError ? (
          <Stack
            spacing={2}
            borderWidth="1px"
            borderRadius="md"
            p={4}
            bg="red.50"
            borderColor="red.200"
          >
            <Text color="red.600" fontWeight="semibold">
              Unable to load notifications
            </Text>
            <Text color="red.500">
              {notificationsQuery.error instanceof Error
                ? notificationsQuery.error.message
                : 'Unable to load notifications.'}
            </Text>
            {errorPayload?.debug?.endpoint ? (
              <Text color="gray.700">
                Endpoint: <Code>{errorPayload.debug.endpoint}</Code>
              </Text>
            ) : null}
            {errorPayload?.debug?.upstreamUrl ? (
              <Text color="gray.700">
                Upstream: <Code>{errorPayload.debug.upstreamUrl}</Code>
              </Text>
            ) : null}
            {typeof errorPayload?.debug?.upstreamStatus === 'number' ? (
              <Text color="gray.700">
                Upstream status:{' '}
                <Code>{String(errorPayload.debug.upstreamStatus)}</Code>
              </Text>
            ) : null}
            <Text color="gray.600" fontSize="sm">
              If you just added this route locally, restart the backend that
              serves saved notifications and try again.
            </Text>
          </Stack>
        ) : null}

        {!notificationsQuery.isLoading &&
        !notificationsQuery.isError &&
        notifications.length === 0 ? (
          <Box borderWidth="1px" borderRadius="md" p={5} bg="gray.50">
            <Text color="gray.600">No new notifications.</Text>
          </Box>
        ) : null}

        <Stack spacing={4}>
          {notifications.map((notification) => {
            const renderedData = formatNotificationData(notification.data);

            return (
              <Box
                key={notification._id}
                borderWidth="1px"
                borderRadius="md"
                p={5}
                bg="white"
              >
                <Flex
                  gap={4}
                  justify="space-between"
                  align={{ base: 'flex-start', md: 'center' }}
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Stack spacing={2} flex="1">
                    <Flex gap={2} wrap="wrap" align="center">
                      <Code>{notification.type}</Code>
                      <Text fontSize="sm" color="gray.500">
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </Flex>
                    <Text color="gray.800">{notification.message}</Text>
                    {renderedData ? (
                      <Code whiteSpace="pre-wrap" display="block" p={3}>
                        {renderedData}
                      </Code>
                    ) : null}
                  </Stack>

                  <Button
                    colorScheme="red"
                    variant="outline"
                    isLoading={
                      dismissMutation.isPending &&
                      dismissMutation.variables === notification._id
                    }
                    onClick={() => dismissMutation.mutate(notification._id)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}
