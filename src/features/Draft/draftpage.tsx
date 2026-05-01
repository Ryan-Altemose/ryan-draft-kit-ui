'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Code, Flex, Stack, Text } from '@chakra-ui/react';
import type {
  CreateLeagueResponse,
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { useUpsertLeague } from '@/features/Leagues/hooks/useUpsertLeague';
import { usePlayers } from '@/shared/hooks/usePlayers';
import DraftLeftPanel from './components/left/DraftLeftPanel';
import DraftMiddlePanel from './components/middle/DraftMiddlePanel';
import DraftRightPanel from './components/right/DraftRightPanel';
import {
  applyDraftPick,
  initializeDraftState,
  toDraftStateJson,
  toDraftLeagueInput,
  undoLastDraftPick,
} from './utils/draftState';

export default function DraftPage() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [lastSaveDebug, setLastSaveDebug] = useState<{
    attemptedAt: string;
    payload: unknown;
    status: 'pending' | 'success' | 'error';
    message: string;
    responseHasDraftStateJson?: boolean;
    backendReceivedHasDraftStateJson?: boolean;
    backendSavedHasDraftStateJson?: boolean;
  } | null>(null);
  const upsertLeagueMutation = useUpsertLeague();
  const { players } = usePlayers();
  const lastSavedSignature = useRef<string>('');

  const draftSaveSignature = useMemo(() => {
    if (!selectedLeague) return '';

    const takenPlayerMetadata = (selectedLeague.taken_players ?? []).map(
      ([playerId]) => {
        const player = players.find((candidate) => candidate._id === playerId);
        return {
          playerId,
          name: player?.name ?? playerId,
          team: player?.team ?? '',
          positions: player?.positions ?? [],
          playerType: player?.playerType ?? 'hitter',
        };
      },
    );

    return JSON.stringify({
      externalId: selectedLeague.externalId,
      taken_players: selectedLeague.taken_players ?? [],
      draft_picks: selectedLeague.draft_picks ?? [],
      teams: selectedLeague.teams ?? [],
      takenPlayerMetadata,
    });
  }, [players, selectedLeague]);

  useEffect(() => {
    if (!selectedLeague || !draftSaveSignature) {
      return;
    }

    if (draftSaveSignature === lastSavedSignature.current) {
      return;
    }

    lastSavedSignature.current = draftSaveSignature;

    const payload = {
      ...toDraftLeagueInput(selectedLeague),
      draftStateJson: toDraftStateJson(selectedLeague, players),
    };

    setLastSaveDebug({
      attemptedAt: new Date().toISOString(),
      payload,
      status: 'pending',
      message: 'Saving draft state to backend...',
    });

    void upsertLeagueMutation
      .mutateAsync({
        input: payload,
        existingLeague: selectedLeague,
      })
      .then((response: CreateLeagueResponse) => {
        setLastSaveDebug({
          attemptedAt: new Date().toISOString(),
          payload,
          status: 'success',
          message: `Saved league ${response.data.name} successfully.`,
          responseHasDraftStateJson: Boolean(response.data.draftStateJson),
          backendReceivedHasDraftStateJson:
            response.debug?.receivedHasDraftStateJson,
          backendSavedHasDraftStateJson: response.debug?.savedHasDraftStateJson,
        });
      })
      .catch((error: unknown) => {
        setLastSaveDebug({
          attemptedAt: new Date().toISOString(),
          payload,
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to save draft state.',
        });
      });
  }, [draftSaveSignature, players, selectedLeague, upsertLeagueMutation]);

  function handleLeagueChange(league: League | null) {
    if (!league) {
      setSelectedLeague(null);
      lastSavedSignature.current = '';
      return;
    }

    const initializedLeague = initializeDraftState(league);
    setSelectedLeague(initializedLeague);
    lastSavedSignature.current = JSON.stringify({
      externalId: initializedLeague.externalId,
      taken_players: initializedLeague.taken_players ?? [],
      draft_picks: initializedLeague.draft_picks ?? [],
      teams: initializedLeague.teams ?? [],
      takenPlayerMetadata: (initializedLeague.taken_players ?? []).map(
        ([playerId]) => ({ playerId }),
      ),
    });
  }

  function handleUndo() {
    if (!selectedLeague) return;
    const nextLeague = undoLastDraftPick(selectedLeague);
    if (nextLeague === selectedLeague) return;

    setSelectedLeague(nextLeague);
  }

  function handlePickEntered(pick: DraftPick, takenEntry: TakenPlayer) {
    if (!selectedLeague) return;
    const nextLeague = applyDraftPick(selectedLeague, pick, takenEntry);

    setSelectedLeague(nextLeague);
  }

  return (
    <Flex h="100vh" overflow="hidden">
      <Box
        flexBasis="16.67%"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="gray.200"
        overflowY="auto"
      >
        <DraftLeftPanel onLeagueChange={handleLeagueChange} />
      </Box>
      <Box
        flexBasis="50%"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <DraftMiddlePanel
          teams={selectedLeague?.teams ?? []}
          takenPlayers={selectedLeague?.taken_players ?? []}
          draftPicks={selectedLeague?.draft_picks ?? []}
          startingBudget={selectedLeague?.totalBudget ?? 0}
          onPickEntered={handlePickEntered}
          onUndo={handleUndo}
        />
      </Box>
      <Box flex={1} minH={0} overflowY="auto">
        <Stack spacing={4} p={4}>
          <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
            <Text fontWeight="semibold">Draft Save Debug</Text>
            {!lastSaveDebug ? (
              <Text mt={2} color="gray.500" fontSize="sm">
                No draft save has been attempted yet.
              </Text>
            ) : (
              <Stack spacing={2} mt={3}>
                <Text fontSize="sm">Status: {lastSaveDebug.status}</Text>
                <Text fontSize="sm">
                  League read backend URL:{' '}
                  {process.env.NEXT_PUBLIC_BACKEND_URL || '(empty)'}
                </Text>
                <Text fontSize="sm">
                  Draft save backend URL:{' '}
                  {process.env.NEXT_PUBLIC_DRAFT_SAVE_BACKEND_URL ||
                    process.env.NEXT_PUBLIC_BACKEND_URL ||
                    '(empty)'}
                </Text>
                <Text fontSize="sm">Time: {lastSaveDebug.attemptedAt}</Text>
                <Text
                  fontSize="sm"
                  color={
                    lastSaveDebug.status === 'error'
                      ? 'red.500'
                      : lastSaveDebug.status === 'success'
                        ? 'green.600'
                        : 'blue.600'
                  }
                >
                  {lastSaveDebug.message}
                </Text>
                <Text fontSize="sm">
                  Has `draftStateJson`:{' '}
                  {lastSaveDebug.payload &&
                  typeof lastSaveDebug.payload === 'object' &&
                  'draftStateJson' in lastSaveDebug.payload
                    ? 'yes'
                    : 'no'}
                </Text>
                {lastSaveDebug.responseHasDraftStateJson !== undefined ? (
                  <Text fontSize="sm">
                    Backend response has `draftStateJson`:{' '}
                    {lastSaveDebug.responseHasDraftStateJson ? 'yes' : 'no'}
                  </Text>
                ) : null}
                {lastSaveDebug.backendReceivedHasDraftStateJson !==
                undefined ? (
                  <Text fontSize="sm">
                    Backend received `draftStateJson`:{' '}
                    {lastSaveDebug.backendReceivedHasDraftStateJson
                      ? 'yes'
                      : 'no'}
                  </Text>
                ) : null}
                {lastSaveDebug.backendSavedHasDraftStateJson !== undefined ? (
                  <Text fontSize="sm">
                    Backend saved `draftStateJson`:{' '}
                    {lastSaveDebug.backendSavedHasDraftStateJson ? 'yes' : 'no'}
                  </Text>
                ) : null}
                <Code whiteSpace="pre" display="block" p={3}>
                  {JSON.stringify(lastSaveDebug.payload, null, 2)}
                </Code>
              </Stack>
            )}
          </Box>
          <DraftRightPanel league={selectedLeague} />
        </Stack>
      </Box>
    </Flex>
  );
}
