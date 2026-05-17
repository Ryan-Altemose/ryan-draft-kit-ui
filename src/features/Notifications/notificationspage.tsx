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
import { useNotifications } from './hooks/useNotifications';
import { useDismissNotification } from './hooks/useDismissNotification';

function formatTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString();
}

export default function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const dismissMutation = useDismissNotification();
  const notifications = notificationsQuery.data?.data ?? [];

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
          <Text color="red.500">
            {notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : 'Unable to load notifications.'}
          </Text>
        ) : null}

        {!notificationsQuery.isLoading &&
        !notificationsQuery.isError &&
        notifications.length === 0 ? (
          <Box borderWidth="1px" borderRadius="md" p={5} bg="gray.50">
            <Text color="gray.600">
              No saved notifications yet. New broadcasts will appear here even
              if you were offline when they were sent.
            </Text>
          </Box>
        ) : null}

        <Stack spacing={4}>
          {notifications.map((notification) => (
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
                  {Object.keys(notification.data ?? {}).length > 0 ? (
                    <Code whiteSpace="pre-wrap" display="block" p={3}>
                      {JSON.stringify(notification.data, null, 2)}
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
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
