'use client';

import { useState } from 'react';
import { Box, Button, Code, Heading, Stack, Text } from '@chakra-ui/react';
import { buildLeagueDraftRosterJson } from '@/features/Draft/utils/buildLeagueDraftRosterJson';
import type { League } from '@/features/Leagues/types/leagues.types';
import { externalApiClient, localApiClient } from '@/shared/utils/api-client';
import { useNotificationCenter } from '@/shared/hooks/useNotificationCenter';
import type { Player } from '@/shared/hooks/usePlayers';

const backendExample = `{
  "_id": "<mongo-league-id>",
  "externalId": "custom-aa-1714512345678",
  "name": "aa",
  "draft_picks": [
    [1, "team-1", "team-1", "<player-id>", 22]
  ],
  "taken_players": [
    ["<player-id>", "team-1", "C-0", 22]
  ],
  "teams": [
    ["team-1", "Team 1", 238]
  ]
}`;

type MongoLeagueData = {
  loadedAt: string;
  count: number;
  listResponse: unknown;
  documents: League[];
};

type LeaguesResponse = {
  success: boolean;
  data: League[];
};

type LeagueResponse = {
  success: boolean;
  data: League;
};

type PlayersResponse = {
  data?: Player[];
  pagination?: {
    totalPages?: number;
  };
};

type NotificationPushResponse = {
  success: boolean;
  data?: {
    pushed: boolean;
    clients: number;
    type: string;
  };
  message?: string;
};

export default function TestPage() {
  const [showBackendLocation, setShowBackendLocation] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const [isTimerPending, setIsTimerPending] = useState(false);
  const [mongoData, setMongoData] = useState<MongoLeagueData | null>(null);
  const [isLoadingMongoData, setIsLoadingMongoData] = useState(false);
  const [mongoDataError, setMongoDataError] = useState<string | null>(null);
  const [rosterJson, setRosterJson] = useState<unknown>(null);
  const [isLoadingRosterJson, setIsLoadingRosterJson] = useState(false);
  const [rosterJsonError, setRosterJsonError] = useState<string | null>(null);
  const { status, lastEvent } = useNotificationCenter();

  async function loadBackendLeagueDocuments() {
    const response = await localApiClient.get<LeaguesResponse>(
      '/api/draft-save/leagues',
      {
        params: { limit: 100, _ts: Date.now() },
        cache: 'no-store',
      },
    );

    const leagues = response.data ?? [];
    const documents = await Promise.all(
      leagues.map(async (league) => {
        try {
          const detail = await localApiClient.get<LeagueResponse>(
            `/api/draft-save/leagues/${league._id}`,
            {
              params: { _ts: Date.now() },
              cache: 'no-store',
            },
          );

          return detail.data ?? league;
        } catch {
          return league;
        }
      }),
    );

    return { response, documents };
  }

  async function loadAllPlayers() {
    const firstPage = await externalApiClient.get<PlayersResponse>(
      '/api/players',
      {
        params: { limit: 100, page: 1, _ts: Date.now() },
        cache: 'no-store',
      },
    );

    const totalPages = firstPage.pagination?.totalPages ?? 1;
    const pageRequests: Promise<PlayersResponse>[] = [];

    for (let page = 2; page <= totalPages; page += 1) {
      pageRequests.push(
        externalApiClient.get<PlayersResponse>('/api/players', {
          params: { limit: 100, page, _ts: Date.now() },
          cache: 'no-store',
        }),
      );
    }

    const remainingPages = await Promise.all(pageRequests);
    return [
      ...(firstPage.data ?? []),
      ...remainingPages.flatMap((page) => page.data ?? []),
    ];
  }

  async function handleLoadAllMongoData() {
    try {
      setIsLoadingMongoData(true);
      setMongoDataError(null);

      const { response, documents } = await loadBackendLeagueDocuments();

      setMongoData({
        loadedAt: new Date().toISOString(),
        count: documents.length,
        listResponse: response,
        documents,
      });
    } catch (error) {
      setMongoDataError(
        error instanceof Error
          ? error.message
          : 'Failed to load MongoDB league data.',
      );
    } finally {
      setIsLoadingMongoData(false);
    }
  }

  async function handleBuildRosterJson() {
    try {
      setIsLoadingRosterJson(true);
      setRosterJsonError(null);

      const [{ documents }, players] = await Promise.all([
        loadBackendLeagueDocuments(),
        loadAllPlayers(),
      ]);

      setRosterJson(buildLeagueDraftRosterJson(documents, players));
    } catch (error) {
      setRosterJsonError(
        error instanceof Error
          ? error.message
          : 'Failed to build league roster JSON.',
      );
    } finally {
      setIsLoadingRosterJson(false);
    }
  }

  async function handleSendTestNotification() {
    try {
      setNotificationError(null);

      const response = await externalApiClient.post<NotificationPushResponse>(
        '/api/notifications/push',
        {
          type: 'injury-update',
          message: 'Fake Player is now injured',
          data: {
            player: 'Fake Player',
            status: 'injured',
            source: 'test-page',
          },
        },
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to push notification.',
        );
      }
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : 'Failed to push notification.',
      );
    }
  }

  function handleScheduleTimerNotification() {
    setNotificationError(null);

    setIsTimerPending(true);
    externalApiClient
      .post<NotificationPushResponse>('/api/notifications/schedule', {
        type: 'timer-test',
        message: 'Button timer 10 sec',
        delayMs: 10_000,
        data: {
          source: 'test-page',
          mode: 'timer',
          delaySeconds: 10,
        },
      })
      .then((response) => {
        if (!response.success) {
          setNotificationError(
            response.message ?? 'Failed to schedule timer notification.',
          );
        }
      })
      .catch((error) => {
        setNotificationError(
          error instanceof Error
            ? error.message
            : 'Failed to schedule timer notification.',
        );
      })
      .finally(() => {
        setIsTimerPending(false);
      });
  }

  return (
    <Box maxW="900px" mx="auto" px={6} py={10}>
      <Stack spacing={5}>
        <Heading size="lg">Test Page</Heading>
        <Text color="gray.600">
          This route is only available if someone manually types{' '}
          <Code>/test</Code>. It is not linked in the app navigation.
        </Text>

        <Button
          alignSelf="flex-start"
          colorScheme="blue"
          onClick={() => setShowBackendLocation((current) => !current)}
        >
          {showBackendLocation
            ? 'Hide Backend Save Location'
            : 'Show Backend Save Location'}
        </Button>

        <Button
          alignSelf="flex-start"
          colorScheme="pink"
          onClick={handleSendTestNotification}
        >
          Send Test Notification
        </Button>

        <Button
          alignSelf="flex-start"
          colorScheme="orange"
          onClick={handleScheduleTimerNotification}
          isLoading={isTimerPending}
          loadingText="Waiting 10 sec"
        >
          Send Timer Signal
        </Button>

        <Stack
          spacing={3}
          borderWidth="1px"
          borderRadius="md"
          p={4}
          bg="gray.50"
        >
          <Text fontWeight="semibold">Notification Stream</Text>
          <Text color="gray.600">
            Status: <Code>{status}</Code>
          </Text>
          {lastEvent ? (
            <Text color="gray.600">
              Last event:{' '}
              <Code>{`${lastEvent.type}: ${lastEvent.message} @ ${lastEvent.timestamp}`}</Code>
            </Text>
          ) : (
            <Text color="gray.500">No notification has been received yet.</Text>
          )}
          {isTimerPending ? (
            <Text color="gray.500">Timer signal queued for 10 seconds.</Text>
          ) : null}
          {notificationError ? (
            <Text color="red.500">{notificationError}</Text>
          ) : null}
        </Stack>

        {showBackendLocation ? (
          <Stack
            spacing={4}
            borderWidth="1px"
            borderRadius="md"
            p={5}
            bg="gray.50"
          >
            <Text>
              Draft state is saved to the backend by the Draft Kit UI{' '}
              <Code>POST /api/draft-save/leagues</Code> request.
            </Text>
            <Text>
              Frontend proxy route:{' '}
              <Code>draft-kit-ui/src/app/api/draft-save/leagues/route.ts</Code>
            </Text>
            <Text>
              Backend route:{' '}
              <Code>draft-kit-backend/src/app/api/leagues/route.ts</Code>
            </Text>
            <Text>
              Mongo model:{' '}
              <Code>
                draft-kit-backend/src/features/Leagues/server/leagues.model.ts
              </Code>
            </Text>
            <Text>
              Saved collection/document fields: <Code>League.draft_picks</Code>,{' '}
              <Code>League.taken_players</Code>, and <Code>League.teams</Code>
            </Text>
            <Text>Example document shape:</Text>
            <Code whiteSpace="pre" display="block" p={4}>
              {backendExample}
            </Code>
          </Stack>
        ) : null}

        <Button
          alignSelf="flex-start"
          colorScheme="teal"
          onClick={handleLoadAllMongoData}
          isLoading={isLoadingMongoData}
        >
          Show All Mongo League Data
        </Button>

        {mongoDataError ? <Text color="red.500">{mongoDataError}</Text> : null}

        {mongoData ? (
          <Box borderWidth="1px" borderRadius="md" p={4}>
            <Text fontWeight="semibold">
              Mongo league documents loaded: {mongoData.count}
            </Text>
            <Text mt={1} color="gray.500" fontSize="sm">
              Loaded at {mongoData.loadedAt}
            </Text>
            <Code whiteSpace="pre" display="block" p={4} mt={3}>
              {JSON.stringify(mongoData, null, 2)}
            </Code>
          </Box>
        ) : null}

        <Button
          alignSelf="flex-start"
          colorScheme="green"
          onClick={handleBuildRosterJson}
          isLoading={isLoadingRosterJson}
        >
          Build Clean Team Roster JSON
        </Button>

        {rosterJsonError ? (
          <Text color="red.500">{rosterJsonError}</Text>
        ) : null}

        {rosterJson ? (
          <Box borderWidth="1px" borderRadius="md" p={4}>
            <Text fontWeight="semibold">Clean league roster JSON</Text>
            <Text mt={1} color="gray.500" fontSize="sm">
              Grouped by league, then by team, using saved backend draft data.
            </Text>
            <Code whiteSpace="pre" display="block" p={4} mt={3}>
              {JSON.stringify(rosterJson, null, 2)}
            </Code>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
