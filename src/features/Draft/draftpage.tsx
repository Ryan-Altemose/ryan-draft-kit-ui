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

export default function DraftPage() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const upsertLeagueMutation = useUpsertLeague();

  function handleLeagueChange(league: League | null) {
    setSelectedLeague(league);
  }

  function handleUndo() {
    if (!selectedLeague) return;
    const picks = selectedLeague.draft_picks ?? [];
    if (picks.length === 0) return;

    const lastPickNumber = picks[picks.length - 1][0];
    const newDraftPicks = picks.filter(([n]) => n !== lastPickNumber);
    const newTakenPlayers = (selectedLeague.taken_players ?? []).filter(
      (entry) => !(entry.length === 5 && entry[4][0] === lastPickNumber),
    );

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

    const draftPicks = selectedLeague.draft_picks ?? [];

    setSelectedLeague({
      ...selectedLeague,
      taken_players: updatedTakenPlayers,
      draft_picks: draftPicks,
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
        draftPicks: draftPicks,
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
