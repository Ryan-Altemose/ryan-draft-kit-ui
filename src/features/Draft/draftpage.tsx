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
import { ensureLeagueHasDraftPicks } from './utils/draftPicks';

export default function DraftPage() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const upsertLeagueMutation = useUpsertLeague();

  function handleLeagueChange(league: League | null) {
    if (!league) {
      setSelectedLeague(null);
      return;
    }

    setSelectedLeague(ensureLeagueHasDraftPicks(league));
  }

  function handleUndo() {
    if (!selectedLeague) return;
    const picks = selectedLeague.draft_picks ?? [];
    if (picks.length === 0) return;

    const [, , winningTeamId, playerId] = picks[picks.length - 1];

    let removed = false;
    const newTakenPlayers = (selectedLeague.taken_players ?? []).filter(
      ([pid, tid, slot]) => {
        if (
          !removed &&
          pid === playerId &&
          tid === winningTeamId &&
          slot === 'DRAFT'
        ) {
          removed = true;
          return false;
        }
        return true;
      },
    );
    const newDraftPicks = picks.slice(0, -1);

    setSelectedLeague({
      ...selectedLeague,
      taken_players: newTakenPlayers,
      draft_picks: newDraftPicks,
    });

    void upsertLeagueMutation.mutateAsync({
      input: {
        name: selectedLeague.name,
        teams: selectedLeague.teams?.length ?? 0,
        draftType: selectedLeague.draftType as 'auction',
        rosterSlots: selectedLeague.rosterSlots,
        totalBudget: selectedLeague.totalBudget ?? 0,
        battingCategories: selectedLeague.battingCategories,
        pitchingCategories: selectedLeague.pitchingCategories,
        minorLeagueSlotsPerTeam: selectedLeague.minorLeagueSlotsPerTeam,
        takenPlayers: newTakenPlayers,
        draftPicks: newDraftPicks,
        teamsData: selectedLeague.teams,
      },
      existingLeague: selectedLeague,
    });
  }

  function handlePickEntered(pick: DraftPick, takenEntry: TakenPlayer) {
    if (!selectedLeague) return;

    const newTakenPlayers = [
      ...(selectedLeague.taken_players ?? []),
      takenEntry,
    ];
    const newDraftPicks = [...(selectedLeague.draft_picks ?? []), pick];

    setSelectedLeague({
      ...selectedLeague,
      taken_players: newTakenPlayers,
      draft_picks: newDraftPicks,
    });

    void upsertLeagueMutation.mutateAsync({
      input: {
        name: selectedLeague.name,
        teams: selectedLeague.teams?.length ?? 0,
        draftType: selectedLeague.draftType as 'auction',
        rosterSlots: selectedLeague.rosterSlots,
        totalBudget: selectedLeague.totalBudget ?? 0,
        battingCategories: selectedLeague.battingCategories,
        pitchingCategories: selectedLeague.pitchingCategories,
        minorLeagueSlotsPerTeam: selectedLeague.minorLeagueSlotsPerTeam,
        takenPlayers: newTakenPlayers,
        draftPicks: newDraftPicks,
        teamsData: selectedLeague.teams,
      },
      existingLeague: selectedLeague,
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
