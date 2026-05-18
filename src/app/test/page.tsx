'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { buildLeagueDraftRosterJson } from '@/features/Draft/utils/buildLeagueDraftRosterJson';
import type { League } from '@/features/Leagues/types/leagues.types';
import { externalApiClient, localApiClient } from '@/shared/utils/api-client';
import { useNotificationCenter } from '@/shared/hooks/useNotificationCenter';
import type { Player } from '@/shared/hooks/usePlayers';
import type { NotificationPushResponse } from '@/features/Notifications/types/notifications.types';

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

type FakePersonActionResponse = {
  success: boolean;
  data?: {
    action?: string;
    exists?: boolean;
    existed?: boolean;
    notificationTriggered?: boolean;
    player?: Player | null;
  };
  message?: string;
};

export default function TestPage() {
  const [showBackendLocation, setShowBackendLocation] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const [customNotificationType, setCustomNotificationType] =
    useState('custom-test');
  const [customNotificationMessage, setCustomNotificationMessage] = useState(
    'Custom notification from /test',
  );
  const [customNotificationData, setCustomNotificationData] = useState(
    '{\n  "player": "Fake Player",\n  "status": "injured"\n}',
  );
  const [notificationDelaySeconds, setNotificationDelaySeconds] = useState('0');
  const [isSendingCustomNotification, setIsSendingCustomNotification] =
    useState(false);
  const [fakePersonResult, setFakePersonResult] = useState<string | null>(null);
  const [fakePersonRecord, setFakePersonRecord] = useState<Player | null>(null);
  const [isCheckingFakePerson, setIsCheckingFakePerson] = useState(false);
  const [isAddingFakePerson, setIsAddingFakePerson] = useState(false);
  const [isRemovingFakePerson, setIsRemovingFakePerson] = useState(false);
  const [isHealingFakePerson, setIsHealingFakePerson] = useState(false);
  const [isInjuringFakePerson, setIsInjuringFakePerson] = useState(false);
  const [isTimerPending, setIsTimerPending] = useState(false);
  const [mongoData, setMongoData] = useState<MongoLeagueData | null>(null);
  const [isLoadingMongoData, setIsLoadingMongoData] = useState(false);
  const [mongoDataError, setMongoDataError] = useState<string | null>(null);
  const [rosterJson, setRosterJson] = useState<unknown>(null);
  const [isLoadingRosterJson, setIsLoadingRosterJson] = useState(false);
  const [rosterJsonError, setRosterJsonError] = useState<string | null>(null);
  const { status, lastEvent, debug } = useNotificationCenter();

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
          },
        },
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to push notification.',
        );
        return;
      }

      if (response.data?.archive && !response.data.archive.archived) {
        setNotificationError(
          response.data.archive.message ??
            'Notification was pushed, but saving it failed.',
        );
      }
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : 'Failed to push notification.',
      );
    }
  }

  async function handleSendCustomNotification() {
    try {
      setNotificationError(null);
      setIsSendingCustomNotification(true);

      const trimmedType = customNotificationType.trim();
      const trimmedMessage = customNotificationMessage.trim();

      if (!trimmedType || !trimmedMessage) {
        setNotificationError('Notification type and message are required.');
        return;
      }

      let parsedData: Record<string, unknown> = {};

      if (customNotificationData.trim()) {
        const candidate = JSON.parse(customNotificationData) as unknown;

        if (
          !candidate ||
          Array.isArray(candidate) ||
          typeof candidate !== 'object'
        ) {
          setNotificationError('Notification data must be a JSON object.');
          return;
        }

        parsedData = candidate as Record<string, unknown>;
      }

      const delayMs = Number(notificationDelaySeconds) * 1000;

      if (delayMs > 0) {
        const response = await externalApiClient.post<NotificationPushResponse>(
          '/api/notifications/schedule',
          {
            type: trimmedType,
            message: trimmedMessage,
            delayMs,
            data: parsedData,
          },
        );

        if (!response.success) {
          setNotificationError(
            response.message ?? 'Failed to schedule custom notification.',
          );
          return;
        }

        if (response.data?.archive && !response.data.archive.archived) {
          setNotificationError(
            response.data.archive.message ??
              'Notification was scheduled, but saving it failed.',
          );
        }

        return;
      }

      const response = await externalApiClient.post<NotificationPushResponse>(
        '/api/notifications/push',
        {
          type: trimmedType,
          message: trimmedMessage,
          data: parsedData,
        },
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to send custom notification.',
        );
        return;
      }

      if (response.data?.archive && !response.data.archive.archived) {
        setNotificationError(
          response.data.archive.message ??
            'Notification was pushed, but saving it failed.',
        );
      }
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Failed to send custom notification.',
      );
    } finally {
      setIsSendingCustomNotification(false);
    }
  }

  async function handleCheckFakePerson() {
    try {
      setNotificationError(null);
      setFakePersonResult(null);
      setIsCheckingFakePerson(true);

      const response = await externalApiClient.get<FakePersonActionResponse>(
        '/api/players/test/fake-person',
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to check Fake Person in the database.',
        );
        return;
      }

      setFakePersonRecord(response.data?.player ?? null);
      setFakePersonResult(
        response.data?.exists
          ? 'Fake Person is currently in the database.'
          : 'Fake Person is not currently in the database.',
      );
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Failed to check Fake Person in the database.',
      );
    } finally {
      setIsCheckingFakePerson(false);
    }
  }

  async function handleAddFakePerson() {
    try {
      setNotificationError(null);
      setFakePersonResult(null);
      setIsAddingFakePerson(true);

      const response = await externalApiClient.post<FakePersonActionResponse>(
        '/api/players/test/fake-person',
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to add Fake Person to the database.',
        );
        return;
      }

      setFakePersonRecord(response.data?.player ?? null);
      setFakePersonResult(
        'Fake Person was added to the database with fresh random stats.',
      );
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Failed to add Fake Person to the database.',
      );
    } finally {
      setIsAddingFakePerson(false);
    }
  }

  async function handleRemoveFakePerson() {
    try {
      setNotificationError(null);
      setFakePersonResult(null);
      setIsRemovingFakePerson(true);

      const response = await externalApiClient.delete<FakePersonActionResponse>(
        '/api/players/test/fake-person',
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to remove Fake Person from the database.',
        );
        return;
      }

      setFakePersonRecord(null);
      setFakePersonResult(
        response.data?.existed
          ? 'Fake Person was removed from the database.'
          : 'Fake Person was already missing from the database.',
      );
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Failed to remove Fake Person from the database.',
      );
    } finally {
      setIsRemovingFakePerson(false);
    }
  }

  async function handleHealFakePerson() {
    try {
      setNotificationError(null);
      setFakePersonResult(null);
      setIsHealingFakePerson(true);

      const response = await externalApiClient.post<FakePersonActionResponse>(
        '/api/players/test/fake-person/healthy',
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to mark Fake Person healthy.',
        );
        return;
      }

      setFakePersonRecord(response.data?.player ?? null);
      setFakePersonResult('Fake Person is now marked healthy.');
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Failed to mark Fake Person healthy.',
      );
    } finally {
      setIsHealingFakePerson(false);
    }
  }

  async function handleInjureFakePerson() {
    try {
      setNotificationError(null);
      setFakePersonResult(null);
      setIsInjuringFakePerson(true);

      const response = await externalApiClient.post<FakePersonActionResponse>(
        '/api/players/test/fake-person/injured',
      );

      if (!response.success) {
        setNotificationError(
          response.message ?? 'Failed to mark Fake Person injured.',
        );
        return;
      }

      setFakePersonRecord(response.data?.player ?? null);
      setFakePersonResult(
        response.data?.notificationTriggered
          ? 'Fake Person is now injured and a notification was triggered naturally.'
          : 'Fake Person is already marked injured, so no new notification was sent.',
      );
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : 'Failed to mark Fake Person injured.',
      );
    } finally {
      setIsInjuringFakePerson(false);
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
          mode: 'timer',
          delaySeconds: 10,
        },
      })
      .then((response) => {
        if (!response.success) {
          setNotificationError(
            response.message ?? 'Failed to schedule timer notification.',
          );
          return;
        }

        if (response.data?.archive && !response.data.archive.archived) {
          setNotificationError(
            response.data.archive.message ??
              'Notification was scheduled, but saving it failed.',
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
          <Text fontWeight="semibold">Custom Notification Tester</Text>
          <Input
            value={customNotificationType}
            onChange={(event) => setCustomNotificationType(event.target.value)}
            placeholder="Notification type"
          />
          <Input
            value={customNotificationMessage}
            onChange={(event) =>
              setCustomNotificationMessage(event.target.value)
            }
            placeholder="Notification message"
          />
          <Select
            value={notificationDelaySeconds}
            onChange={(event) =>
              setNotificationDelaySeconds(event.target.value)
            }
          >
            <option value="0">Send instantly</option>
            <option value="1">Delay 1 second</option>
            <option value="2">Delay 2 seconds</option>
            <option value="3">Delay 3 seconds</option>
            <option value="4">Delay 4 seconds</option>
            <option value="5">Delay 5 seconds</option>
          </Select>
          <Textarea
            minH="160px"
            value={customNotificationData}
            onChange={(event) => setCustomNotificationData(event.target.value)}
            placeholder='{"player":"Fake Player","status":"injured"}'
          />
          <Button
            alignSelf="flex-start"
            colorScheme="green"
            onClick={handleSendCustomNotification}
            isLoading={isSendingCustomNotification}
            loadingText="Sending notification"
          >
            Send Custom Notification
          </Button>
        </Stack>

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
          {status === 'error' ? (
            <Stack
              spacing={2}
              pt={2}
              borderTopWidth="1px"
              borderColor="red.100"
            >
              <Text color="red.600" fontWeight="semibold">
                Stream debug
              </Text>
              <Text color="gray.600">
                Endpoint: <Code>{debug.streamUrl}</Code>
              </Text>
              <Text color="gray.600">
                Last connected at:{' '}
                <Code>{debug.lastConnectedAt ?? 'never'}</Code>
              </Text>
              <Text color="gray.600">
                Last error at: <Code>{debug.lastErrorAt ?? 'unknown'}</Code>
              </Text>
              <Text color="gray.600">
                Last event received at:{' '}
                <Code>{debug.lastEventAt ?? 'none'}</Code>
              </Text>
              <Text color="gray.600">
                Browser readyState: <Code>{String(debug.lastReadyState)}</Code>
              </Text>
              <Text color="gray.500" fontSize="sm">
                If this is Vercel, check the app route <Code>/api/events</Code>,
                the server env vars <Code>NOTIFICATION_STREAM_URL</Code>,{' '}
                <Code>API_URL</Code>, and <Code>API_KEY</Code>, and confirm the
                upstream stream is reachable from the deployment.
              </Text>
            </Stack>
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

        <Stack
          spacing={3}
          borderWidth="1px"
          borderRadius="md"
          p={4}
          bg="gray.50"
        >
          <Text fontWeight="semibold">Fake Person Injury Tester</Text>
          <Text color="gray.600" fontSize="sm">
            These buttons operate on a dedicated test player in the API database
            and let you trigger an injury notification through a normal player
            update.
          </Text>
          <Flex gap={3} wrap="wrap">
            <Button
              colorScheme="blue"
              onClick={handleAddFakePerson}
              isLoading={isAddingFakePerson}
            >
              Add Fake Person
            </Button>
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={handleCheckFakePerson}
              isLoading={isCheckingFakePerson}
            >
              Check If In DB
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleRemoveFakePerson}
              isLoading={isRemovingFakePerson}
            >
              Remove From DB
            </Button>
            <Button
              colorScheme="green"
              onClick={handleHealFakePerson}
              isLoading={isHealingFakePerson}
            >
              He Is Healthy
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleInjureFakePerson}
              isLoading={isInjuringFakePerson}
            >
              He Is Now Injured
            </Button>
          </Flex>
          {fakePersonResult ? (
            <Text color="green.700">{fakePersonResult}</Text>
          ) : null}
          {fakePersonRecord ? (
            <Code whiteSpace="pre-wrap" display="block" p={3}>
              {JSON.stringify(fakePersonRecord, null, 2)}
            </Code>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
