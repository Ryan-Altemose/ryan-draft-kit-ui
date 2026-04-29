'use client';

import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { useUpsertLeague } from '@/features/Leagues/hooks/useUpsertLeague';
import DraftLeftPanel from './components/left/DraftLeftPanel';
import DraftMiddlePanel from './components/middle/DraftMiddlePanel';
import DraftRightPanel from './components/right/DraftRightPanel';
import {
  applyDraftPick,
  initializeDraftState,
  toDraftLeagueInput,
  undoLastDraftPick,
} from './utils/draftState';

export default function DraftPage() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const upsertLeagueMutation = useUpsertLeague();

  function handleLeagueChange(league: League | null) {
    if (!league) {
      setSelectedLeague(null);
      return;
    }

    setSelectedLeague(initializeDraftState(league));
  }

  function handleUndo() {
    if (!selectedLeague) return;
    const nextLeague = undoLastDraftPick(selectedLeague);
    if (nextLeague === selectedLeague) return;

    setSelectedLeague(nextLeague);

    void upsertLeagueMutation.mutateAsync({
      input: toDraftLeagueInput(nextLeague),
      existingLeague: nextLeague,
    });
  }

  function handlePickEntered(pick: DraftPick, takenEntry: TakenPlayer) {
    if (!selectedLeague) return;
    const nextLeague = applyDraftPick(selectedLeague, pick, takenEntry);

    setSelectedLeague(nextLeague);

    void upsertLeagueMutation.mutateAsync({
      input: toDraftLeagueInput(nextLeague),
      existingLeague: nextLeague,
    });
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
        <DraftRightPanel league={selectedLeague} />
      </Box>
    </Flex>
  );
}
