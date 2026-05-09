'use client';

import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type {
  DraftPick,
  League,
  LeagueDraft,
  LeagueResponse,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { useUpsertLeague } from '@/features/Leagues/hooks/useUpsertLeague';
import { localApiClient } from '@/shared/utils/api-client';
import { toDraftLeagueInput } from './utils/draftState';
import DraftLeftPanel from './components/left/DraftLeftPanel';
import DraftMiddlePanel from './components/middle/DraftMiddlePanel';
import DraftRightPanel from './components/right/DraftRightPanel';

export default function DraftPage() {
  const searchParams = useSearchParams();
  const initialLeagueId = searchParams.get('leagueId') ?? undefined;
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<LeagueDraft | null>(null);
  const upsertLeagueMutation = useUpsertLeague();
  const queryClient = useQueryClient();

  function handleLeagueChange(league: League | null) {
    setSelectedLeague(league);
    setSelectedDraft(null);
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

  async function handleFinishDraft(name: string) {
    if (!selectedLeague) return;

    const response = await localApiClient.post<LeagueResponse>(
      `/api/leagues/${selectedLeague._id}/finish-draft`,
      { name },
    );

    if (response?.success && response.data) {
      const updated = response.data;
      setSelectedLeague(updated);
      queryClient.setQueryData(['draft-save-league', updated._id], {
        success: true,
        data: updated,
      });
      void queryClient.invalidateQueries({ queryKey: ['draft-save-leagues'] });
      void queryClient.invalidateQueries({ queryKey: ['leagues'] });
      void queryClient.invalidateQueries({ queryKey: ['league'] });
    }
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
        <DraftLeftPanel
          onLeagueChange={handleLeagueChange}
          onDraftChange={setSelectedDraft}
          initialLeagueId={initialLeagueId}
        />
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
          draftPicks={
            selectedDraft?.draft_picks ?? selectedLeague?.draft_picks ?? []
          }
          startingBudget={selectedLeague?.totalBudget ?? 0}
          rosterSlots={selectedLeague?.rosterSlots}
          minorLeagueSlots={selectedLeague?.minorLeagueSlotsPerTeam ?? 0}
          leagueType={selectedLeague?.leagueType}
          onPickEntered={handlePickEntered}
          onUndo={handleUndo}
          onFinishDraft={handleFinishDraft}
          readOnly={Boolean(selectedDraft)}
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
