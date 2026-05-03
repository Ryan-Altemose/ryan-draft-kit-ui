'use client';

import { useState } from 'react';
import { Badge, Box, Button, Code, Flex, Stack, Text } from '@chakra-ui/react';
import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { useUpsertLeague } from '@/features/Leagues/hooks/useUpsertLeague';
import { toDraftLeagueInput } from './utils/draftState';
import DraftLeftPanel from './components/left/DraftLeftPanel';
import DraftMiddlePanel from './components/middle/DraftMiddlePanel';
import DraftRightPanel from './components/right/DraftRightPanel';

export default function DraftPage() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [showDebugWindow, setShowDebugWindow] = useState(false);
  const upsertLeagueMutation = useUpsertLeague();

  function handleLeagueChange(league: League | null) {
    setSelectedLeague(league);
  }

  function saveDraftLeague(league: League) {
    setSelectedLeague(league);

    void upsertLeagueMutation.mutateAsync({
      input: toDraftLeagueInput(league),
      existingLeague: league,
      endpoint: '/api/draft-save/leagues',
    });
  }

  function handleUndo() {
    if (!selectedLeague) return;
    const picks = selectedLeague.draft_picks ?? [];
    if (picks.length === 0) return;

    const [lastPickNumber, , , lastPlayerId] = picks[picks.length - 1];
    const newDraftPicks = picks.filter(([n]) => n !== lastPickNumber);
    const newTakenPlayers = (selectedLeague.taken_players ?? []).filter(
      ([pid]) => pid !== lastPlayerId,
    );

    saveDraftLeague({
      ...selectedLeague,
      taken_players: newTakenPlayers,
      draft_picks: newDraftPicks,
    });
  }

  function handleSaveRosters(updatedTakenPlayers: TakenPlayer[]) {
    if (!selectedLeague) return;

    const draftPicks = selectedLeague.draft_picks ?? [];

    saveDraftLeague({
      ...selectedLeague,
      taken_players: updatedTakenPlayers,
      draft_picks: draftPicks,
    });
  }

  function handlePickEntered(pick: DraftPick, takenEntry: TakenPlayer) {
    if (!selectedLeague) return;

    const newTakenPlayers = [
      ...(selectedLeague.taken_players ?? []),
      takenEntry,
    ];
    const newDraftPicks = [...(selectedLeague.draft_picks ?? []), pick];

    saveDraftLeague({
      ...selectedLeague,
      taken_players: newTakenPlayers,
      draft_picks: newDraftPicks,
    });
  }

  const debugPayload = selectedLeague
    ? {
        saveStatus: {
          isSaving: upsertLeagueMutation.isPending,
          isError: upsertLeagueMutation.isError,
          error:
            upsertLeagueMutation.error instanceof Error
              ? upsertLeagueMutation.error.message
              : null,
        },
        league: {
          _id: selectedLeague._id,
          externalId: selectedLeague.externalId,
          name: selectedLeague.name,
          updatedAt: selectedLeague.updatedAt,
        },
        counts: {
          teams: selectedLeague.teams?.length ?? 0,
          takenPlayers: selectedLeague.taken_players?.length ?? 0,
          draftPicks: selectedLeague.draft_picks?.length ?? 0,
        },
        teams: selectedLeague.teams ?? [],
        taken_players: selectedLeague.taken_players ?? [],
        draft_picks: selectedLeague.draft_picks ?? [],
        fullSelectedLeague: selectedLeague,
      }
    : {
        saveStatus: {
          isSaving: upsertLeagueMutation.isPending,
          isError: upsertLeagueMutation.isError,
          error:
            upsertLeagueMutation.error instanceof Error
              ? upsertLeagueMutation.error.message
              : null,
        },
        selectedLeague: null,
      };

  return (
    <>
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
            rosterSlots={selectedLeague?.rosterSlots}
            minorLeagueSlots={selectedLeague?.minorLeagueSlotsPerTeam ?? 0}
            onPickEntered={handlePickEntered}
            onUndo={handleUndo}
          />
        </Box>
        <Box flex={1} minW={0} overflow="hidden">
          <DraftRightPanel
            league={selectedLeague}
            onSaveRosters={handleSaveRosters}
            isSavingRosters={upsertLeagueMutation.isPending}
          />
        </Box>
      </Flex>

      <Button
        position="fixed"
        right={4}
        bottom={4}
        zIndex="modal"
        size="sm"
        colorScheme="teal"
        onClick={() => setShowDebugWindow((current) => !current)}
      >
        {showDebugWindow ? 'Hide Debug' : 'Show Debug'}
      </Button>

      {showDebugWindow ? (
        <Box
          position="fixed"
          right={4}
          bottom={16}
          zIndex="modal"
          w={{ base: 'calc(100vw - 32px)', md: '520px' }}
          maxH="72vh"
          overflow="hidden"
          borderWidth="1px"
          borderColor="gray.300"
          borderRadius="md"
          bg="white"
          boxShadow="xl"
        >
          <Flex
            align="center"
            justify="space-between"
            gap={3}
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="gray.200"
          >
            <Box>
              <Text fontWeight="semibold">Draft Debug</Text>
              <Text fontSize="xs" color="gray.500">
                Live UI state for the selected draft league
              </Text>
            </Box>
            <Badge
              colorScheme={
                upsertLeagueMutation.isError
                  ? 'red'
                  : upsertLeagueMutation.isPending
                    ? 'yellow'
                    : 'green'
              }
            >
              {upsertLeagueMutation.isError
                ? 'save error'
                : upsertLeagueMutation.isPending
                  ? 'saving'
                  : 'ready'}
            </Badge>
          </Flex>

          <Stack spacing={3} p={4} maxH="calc(72vh - 68px)" overflowY="auto">
            <Flex gap={2} wrap="wrap">
              <Badge>teams: {selectedLeague?.teams?.length ?? 0}</Badge>
              <Badge>
                players: {selectedLeague?.taken_players?.length ?? 0}
              </Badge>
              <Badge>picks: {selectedLeague?.draft_picks?.length ?? 0}</Badge>
            </Flex>

            <Code
              whiteSpace="pre"
              display="block"
              p={3}
              overflowX="auto"
              fontSize="xs"
            >
              {JSON.stringify(debugPayload, null, 2)}
            </Code>
          </Stack>
        </Box>
      ) : null}
    </>
  );
}
