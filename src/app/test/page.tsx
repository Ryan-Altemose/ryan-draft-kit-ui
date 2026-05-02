'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Code,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { localApiClient } from '@/shared/utils/api-client';

const backendExample = `{
  "_id": "<mongo-league-id>",
  "externalId": "custom-aa-1714512345678",
  "name": "aa",
  "draftStateJson": {
    "league": {
      "leagueId": "<mongo-league-id>",
      "externalId": "custom-aa-1714512345678",
      "name": "aa"
    }
  }
}`;

type LeagueWithDraftState = {
  _id: string;
  externalId: string;
  name: string;
  draftStateJson?: unknown;
};

type LeagueDebugRecord = LeagueWithDraftState & {
  listHasDraftStateJson: boolean;
  detailHasDraftStateJson: boolean;
  detailRequestStatus: 'success' | 'error';
  detailErrorMessage?: string;
  listPreview: unknown;
  detailPreview: unknown;
};

type LeaguesResponse = {
  success: boolean;
  data: LeagueWithDraftState[];
};

type LeagueResponse = {
  success: boolean;
  data: LeagueWithDraftState;
};

export default function TestPage() {
  const [showBackendLocation, setShowBackendLocation] = useState(false);
  const [savedJsons, setSavedJsons] = useState<LeagueDebugRecord[]>([]);
  const [isLoadingJsons, setIsLoadingJsons] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function handleLoadSavedJsons() {
    try {
      setIsLoadingJsons(true);
      setJsonError(null);

      const response = await localApiClient.get<LeaguesResponse>(
        '/api/draft-save/leagues',
        {
          params: { limit: 100, _ts: Date.now() },
          cache: 'no-store',
        },
      );

      const leagues = response.data ?? [];
      const detailedLeagues = await Promise.all(
        leagues.map(async (league) => {
          try {
            const detail = await localApiClient.get<LeagueResponse>(
              `/api/draft-save/leagues/${league._id}`,
              {
                params: { _ts: Date.now() },
                cache: 'no-store',
              },
            );

            const detailLeague = detail.data ?? league;

            return {
              ...detailLeague,
              listHasDraftStateJson: Boolean(league.draftStateJson),
              detailHasDraftStateJson: Boolean(detailLeague.draftStateJson),
              detailRequestStatus: 'success' as const,
              listPreview: league,
              detailPreview: detailLeague,
            };
          } catch (error) {
            return {
              ...league,
              listHasDraftStateJson: Boolean(league.draftStateJson),
              detailHasDraftStateJson: false,
              detailRequestStatus: 'error' as const,
              detailErrorMessage:
                error instanceof Error ? error.message : 'Detail fetch failed.',
              listPreview: league,
              detailPreview: null,
            };
          }
        }),
      );

      setSavedJsons(detailedLeagues);
    } catch (error) {
      setJsonError(
        error instanceof Error
          ? error.message
          : 'Failed to load saved draft state JSONs.',
      );
    } finally {
      setIsLoadingJsons(false);
    }
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

        {showBackendLocation ? (
          <Stack
            spacing={4}
            borderWidth="1px"
            borderRadius="md"
            p={5}
            bg="gray.50"
          >
            <Text>
              The draft-state JSON is saved to the backend by the Draft Kit UI
              `POST /api/draft-save/leagues` request.
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
              Saved collection/document field:{' '}
              <Code>League.draftStateJson</Code>
            </Text>
            <Text>Example document shape:</Text>
            <Code whiteSpace="pre" display="block" p={4}>
              {backendExample}
            </Code>
          </Stack>
        ) : null}

        <Button
          alignSelf="flex-start"
          variant="outline"
          onClick={handleLoadSavedJsons}
          isLoading={isLoadingJsons}
        >
          Load All Saved Draft JSONs
        </Button>

        {isLoadingJsons ? <Spinner size="sm" /> : null}

        {jsonError ? <Text color="red.500">{jsonError}</Text> : null}

        {savedJsons.length > 0 ? (
          <Stack spacing={4}>
            {savedJsons.map((league) => (
              <Box key={league._id} borderWidth="1px" borderRadius="md" p={4}>
                <Text fontWeight="semibold">
                  {league.name} ({league.externalId})
                </Text>
                <Stack spacing={1} mt={3}>
                  <Text fontSize="sm">
                    List endpoint has `draftStateJson`:{' '}
                    {league.listHasDraftStateJson ? 'yes' : 'no'}
                  </Text>
                  <Text fontSize="sm">
                    Detail endpoint has `draftStateJson`:{' '}
                    {league.detailHasDraftStateJson ? 'yes' : 'no'}
                  </Text>
                  <Text fontSize="sm">
                    Detail request status: {league.detailRequestStatus}
                  </Text>
                  {league.detailErrorMessage ? (
                    <Text fontSize="sm" color="red.500">
                      Detail error: {league.detailErrorMessage}
                    </Text>
                  ) : null}
                </Stack>
                {league.draftStateJson ? (
                  <Code whiteSpace="pre" display="block" p={4} mt={3}>
                    {JSON.stringify(league.draftStateJson, null, 2)}
                  </Code>
                ) : (
                  <Text mt={3} color="orange.500" fontSize="sm">
                    No saved draftStateJson on this league document.
                  </Text>
                )}
                <Text mt={4} fontSize="sm" fontWeight="semibold">
                  List payload preview
                </Text>
                <Code whiteSpace="pre" display="block" p={4} mt={2}>
                  {JSON.stringify(league.listPreview, null, 2)}
                </Code>
                <Text mt={4} fontSize="sm" fontWeight="semibold">
                  Detail payload preview
                </Text>
                <Code whiteSpace="pre" display="block" p={4} mt={2}>
                  {JSON.stringify(league.detailPreview, null, 2)}
                </Code>
              </Box>
            ))}
          </Stack>
        ) : null}

        {!isLoadingJsons && !jsonError && savedJsons.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            No saved draft-state JSON documents have been loaded yet, or none
            exist in the backend.
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
