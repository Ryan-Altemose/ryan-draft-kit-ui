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
import { backendClient } from '@/shared/utils/api-client';

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

type LeaguesResponse = {
  success: boolean;
  data: LeagueWithDraftState[];
};

export default function TestPage() {
  const [showBackendLocation, setShowBackendLocation] = useState(false);
  const [savedJsons, setSavedJsons] = useState<LeagueWithDraftState[]>([]);
  const [isLoadingJsons, setIsLoadingJsons] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function handleLoadSavedJsons() {
    try {
      setIsLoadingJsons(true);
      setJsonError(null);

      const response = await backendClient.get<LeaguesResponse>(
        '/api/leagues',
        {
          params: { limit: 100, _ts: Date.now() },
          cache: 'no-store',
        },
      );

      setSavedJsons(response.data ?? []);
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
              `POST /api/leagues` request.
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
                {league.draftStateJson ? (
                  <Code whiteSpace="pre" display="block" p={4} mt={3}>
                    {JSON.stringify(league.draftStateJson, null, 2)}
                  </Code>
                ) : (
                  <Text mt={3} color="orange.500" fontSize="sm">
                    No saved draftStateJson on this league document.
                  </Text>
                )}
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
