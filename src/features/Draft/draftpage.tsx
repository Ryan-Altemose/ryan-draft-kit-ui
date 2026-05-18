'use client';

import { useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type {
  DraftPick,
  League,
  LeagueResponse,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { useUpsertLeague } from '@/features/Leagues/hooks/useUpsertLeague';
import { localApiClient } from '@/shared/utils/api-client';
import type { Player as DraftPlayer } from '@/shared/hooks/usePlayers';
import type { Player as NotebookPlayer } from '@/features/Notebook/types/notebook.types';
import NotebookWorkspace from '@/features/Notebook/components/NotebookWorkspace';
import { useNotebookManager } from '@/features/Notebook/hooks/useNotebookManager';
import { useLeagueValuations } from '@/features/Valuations/hooks/useLeagueValuations';
import { toDraftLeagueInput } from './utils/draftState';
import DraftLeftPanel, {
  type DraftSelection,
} from './components/left/DraftLeftPanel';
import DraftMiddlePanel from './components/middle/DraftMiddlePanel';
import DraftRightPanel from './components/right/DraftRightPanel';

function buildLegacyDraftLeague(league: League, draft: DraftSelection): League {
  const draftPicks = draft.draft_picks ?? [];
  const totalBudget = league.totalBudget ?? 0;
  const spentByTeam = new Map<string, number>();

  draftPicks.forEach(([, , winningTeamId, , salary]) => {
    spentByTeam.set(
      winningTeamId,
      (spentByTeam.get(winningTeamId) ?? 0) + salary,
    );
  });

  const teams =
    (league.teams?.map(([teamId, teamName]) => [
      teamId,
      teamName,
      Math.max(0, totalBudget - (spentByTeam.get(teamId) ?? 0)),
    ]) as League['teams']) ?? [];

  const takenPlayers: TakenPlayer[] = draftPicks.map(
    ([, , winningTeamId, playerId, salary]) => [
      playerId,
      winningTeamId,
      'DRAFT',
      salary,
      '',
    ],
  );

  return {
    ...league,
    teams,
    taken_players: takenPlayers,
    draft_picks: draftPicks,
  };
}

export default function DraftPage() {
  const searchParams = useSearchParams();
  const initialLeagueId = searchParams.get('leagueId') ?? undefined;
  const copyDraftCancelRef = useRef<HTMLButtonElement>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftSelection | null>(
    null,
  );
  const [isCopyingDraft, setIsCopyingDraft] = useState(false);
  const [showCopyDraftWarning, setShowCopyDraftWarning] = useState(false);
  const upsertLeagueMutation = useUpsertLeague();
  const queryClient = useQueryClient();
  const valuationsQuery = useLeagueValuations(selectedLeague);
  const {
    selectedNotebookId,
    selectedNotebookName,
    selectedNotebookContent,
    selectedPlayerName,
    selectedPlayer,
    updateNotebookContent,
    updatePlayerContent,
    openPlayerNotebook,
    closeNotebook,
  } = useNotebookManager();

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

  function handlePlayerNotebookOpen(player: NotebookPlayer) {
    openPlayerNotebook({
      ...player,
      injuryStatus: player.injuryStatus ?? 'unknown',
    });
  }

  function handleDraftRosterPlayerNotebookOpen(player: DraftPlayer) {
    openPlayerNotebook({
      ...player,
      injuryStatus: player.injuryStatus ?? 'unknown',
    });
  }

  const selectedArchivedDraftId =
    selectedDraft && '_id' in selectedDraft ? selectedDraft._id : undefined;

  async function copySelectedDraftToLiveDraft() {
    if (!selectedLeague || !selectedDraft) return;

    try {
      setIsCopyingDraft(true);

      if (selectedArchivedDraftId) {
        const response = await localApiClient.post<LeagueResponse>(
          `/api/draft-save/leagues/${selectedLeague._id}/drafts/${selectedArchivedDraftId}/copy`,
        );

        if (response?.success && response.data) {
          const updated = response.data;
          setSelectedLeague(updated);
          setSelectedDraft(null);
          queryClient.setQueryData(['draft-save-league', updated._id], {
            success: true,
            data: updated,
          });
          void queryClient.invalidateQueries({
            queryKey: ['draft-save-leagues'],
          });
          void queryClient.invalidateQueries({
            queryKey: ['league-valuations', updated._id],
          });
        }
        return;
      }

      const updatedLeague = buildLegacyDraftLeague(
        selectedLeague,
        selectedDraft,
      );
      await upsertLeagueMutation.mutateAsync({
        input: toDraftLeagueInput(updatedLeague),
        existingLeague: updatedLeague,
        endpoint: '/api/draft-save/leagues',
      });

      setSelectedLeague(updatedLeague);
      setSelectedDraft(null);
      queryClient.setQueryData(['draft-save-league', updatedLeague._id], {
        success: true,
        data: updatedLeague,
      });
      void queryClient.invalidateQueries({ queryKey: ['draft-save-leagues'] });
      void queryClient.invalidateQueries({
        queryKey: ['league-valuations', updatedLeague._id],
      });
    } finally {
      setIsCopyingDraft(false);
      setShowCopyDraftWarning(false);
    }
  }

  function handleCopySelectedDraft() {
    if (!selectedLeague || !selectedDraft) return;

    const hasActiveLiveDraftState =
      (selectedLeague.taken_players?.length ?? 0) > 0 ||
      (selectedLeague.draft_picks?.length ?? 0) > 0;

    if (hasActiveLiveDraftState) {
      setShowCopyDraftWarning(true);
      return;
    }

    void copySelectedDraftToLiveDraft();
  }

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
          <DraftLeftPanel
            onLeagueChange={handleLeagueChange}
            onDraftChange={setSelectedDraft}
            onCopySelectedDraft={handleCopySelectedDraft}
            canCopySelectedDraft={Boolean(selectedDraft)}
            isCopyingDraft={isCopyingDraft}
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
            onValuationPlayerClick={handlePlayerNotebookOpen}
            valuations={valuationsQuery.data}
            previewRows={valuationsQuery.previewRows}
            isLoadingValuations={valuationsQuery.isLoading}
            isLoadingValuationPreview={valuationsQuery.isLoadingPreview}
            readOnly={Boolean(selectedDraft)}
          />
        </Box>
        <Box flex={1} minW={0} overflow="hidden">
          <DraftRightPanel
            league={selectedLeague}
            onSaveRosters={handleSaveRosters}
            isSavingRosters={upsertLeagueMutation.isPending}
            onPlayerNotebookOpen={handleDraftRosterPlayerNotebookOpen}
          />
        </Box>
      </Flex>
      <AlertDialog
        isOpen={showCopyDraftWarning}
        leastDestructiveRef={copyDraftCancelRef}
        onClose={() => setShowCopyDraftWarning(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Override Live Draft?
            </AlertDialogHeader>

            <AlertDialogBody>
              The current live draft already has players picked. Copying this
              draft will override the current live draft state with this saved
              draft.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={copyDraftCancelRef}
                onClick={() => setShowCopyDraftWarning(false)}
              >
                Cancel
              </Button>
              <Button
                colorScheme="green"
                ml={3}
                onClick={() => void copySelectedDraftToLiveDraft()}
                isLoading={isCopyingDraft}
              >
                Copy This Draft
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <NotebookWorkspace
        selectedNotebookId={selectedNotebookId}
        selectedNotebookName={selectedNotebookName}
        selectedNotebookContent={selectedNotebookContent}
        onNotebookContentChange={updateNotebookContent}
        onPlayerContentChange={updatePlayerContent}
        selectedPlayerName={selectedPlayerName}
        selectedPlayer={selectedPlayer}
        onCloseNotebook={closeNotebook}
        onOpenPlayerNotebook={openPlayerNotebook}
        showLauncher={false}
      />
    </>
  );
}
