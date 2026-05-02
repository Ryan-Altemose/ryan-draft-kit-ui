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
import { deriveDraftPicksFromTakenPlayers } from './utils/draftPicks';

export default function DraftPage() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const upsertLeagueMutation = useUpsertLeague();

  function handleLeagueChange(league: League | null) {
    setSelectedLeague(league);
  }

  function handleUndo() {
    if (!selectedLeague) return;
    const picks = deriveDraftPicksFromTakenPlayers(
      selectedLeague.taken_players ?? [],
    );
    if (picks.length === 0) return;

    const [lastPickNumber] = picks[picks.length - 1];

    const allTaken = selectedLeague.taken_players ?? [];
    const newTakenPlayers = allTaken.filter((entry) => {
      if (entry.length !== 5) return true;
      const [pickNumber] = entry[4];
      return pickNumber !== lastPickNumber;
    });
    const newDraftPicks = deriveDraftPicksFromTakenPlayers(newTakenPlayers);

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

  function handleSaveRosters(updatedTakenPlayers: TakenPlayer[]) {
    if (!selectedLeague) return;

    const newDraftPicks = deriveDraftPicksFromTakenPlayers(updatedTakenPlayers);

    setSelectedLeague({
      ...selectedLeague,
      taken_players: updatedTakenPlayers,
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
        takenPlayers: updatedTakenPlayers,
        draftPicks: newDraftPicks,
        teamsData: selectedLeague.teams,
      },
      existingLeague: selectedLeague,
    });
  }

  function handlePickEntered(_pick: DraftPick, takenEntry: TakenPlayer) {
    if (!selectedLeague) return;

    const newTakenPlayers = [
      ...(selectedLeague.taken_players ?? []),
      takenEntry,
    ];
    const newDraftPicks = deriveDraftPicksFromTakenPlayers(newTakenPlayers);

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
  );
}
