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
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useLeague } from './hooks/useLeague';
import { useLeagueDraft } from './hooks/useLeagueDraft';
import LeagueTeamTable from './components/LeagueTeamTable';
import type { LeagueTeam, TakenPlayer } from './types/leagues.types';
import type { LeagueResponse } from './types/leagues.types';
import type { Player as RosterPlayer } from '@/shared/hooks/usePlayers';
import type { Player as NotebookPlayer } from '@/features/Notebook/types/notebook.types';
import NotebookWorkspace from '@/features/Notebook/components/NotebookWorkspace';
import { useNotebookManager } from '@/features/Notebook/hooks/useNotebookManager';
import { localApiClient } from '@/shared/utils/api-client';

function toNotebookPlayer(player: RosterPlayer): NotebookPlayer {
  return {
    ...player,
    injuryStatus: player.injuryStatus ?? 'unknown',
  };
}

export default function LeagueDraftDetailPage({
  leagueId,
  draftId,
}: {
  leagueId: string;
  draftId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isCopyingDraft, setIsCopyingDraft] = useState(false);
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const { data: leagueData, isLoading: isLoadingLeague } = useLeague(leagueId, {
    endpointBase: '/api/draft-save/leagues',
    queryKeyPrefix: 'draft-save-league',
  });
  const { data: draftData, isLoading: isLoadingDraft } = useLeagueDraft(
    leagueId,
    draftId,
  );
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

  const league = leagueData?.data;
  const draft = draftData?.data;

  if (isLoadingLeague || isLoadingDraft) return <Spinner />;
  if (!league) return <Text>League not found</Text>;
  if (!draft) return <Text>Draft not found</Text>;

  const teams = (draft.teams ?? []) as LeagueTeam[];
  const takenPlayers = (draft.taken_players ?? []) as TakenPlayer[];
  const startingBudget = draft.totalBudget ?? league.totalBudget ?? 0;
  const hasActiveLiveDraftState =
    (league.taken_players?.length ?? 0) > 0 ||
    (league.draft_picks?.length ?? 0) > 0;

  function handlePlayerNotebookOpen(player: RosterPlayer) {
    openPlayerNotebook(toNotebookPlayer(player));
  }

  async function handleCopyDraft() {
    try {
      setIsCopyingDraft(true);
      setCopyError(null);

      const response = await localApiClient.post<LeagueResponse>(
        `/api/draft-save/leagues/${leagueId}/drafts/${draftId}/copy`,
      );

      if (response?.success && response.data) {
        queryClient.setQueryData(['draft-save-league', leagueId], response);
        void queryClient.invalidateQueries({
          queryKey: ['draft-save-leagues'],
        });
        setShowOverrideWarning(false);
        router.push(`/draft?leagueId=${encodeURIComponent(leagueId)}`);
      }
    } catch (error) {
      setCopyError(
        error instanceof Error ? error.message : 'Failed to copy draft',
      );
    } finally {
      setIsCopyingDraft(false);
    }
  }

  function handleCopyButtonClick() {
    if (hasActiveLiveDraftState) {
      setShowOverrideWarning(true);
      return;
    }

    void handleCopyDraft();
  }

  return (
    <>
      <Box p={8}>
        <Stack spacing={4}>
          <Stack direction="row" spacing={2} align="center">
            <Button as={Link} href={`/leagues/${leagueId}`} variant="ghost">
              Back
            </Button>
            <Button
              colorScheme="green"
              onClick={handleCopyButtonClick}
              isLoading={isCopyingDraft}
            >
              Copy This Draft
            </Button>
          </Stack>

          <Heading>{draft.name}</Heading>

          <Text fontSize="sm" color="gray.600">
            League: {league.name} • Picks: {draft.draft_picks?.length ?? 0} •
            Players: {draft.taken_players?.length ?? 0}
          </Text>

          <Stack spacing={4}>
            {teams.map((team, index) => {
              const [teamId] = team;
              const takenPlayersForTeam = takenPlayers.filter(
                ([, tid]) => tid === teamId,
              );
              return (
                <LeagueTeamTable
                  key={`${draftId}-${teamId}`}
                  team={team}
                  rosterSlots={league.rosterSlots}
                  allTakenPlayers={takenPlayers}
                  takenPlayers={takenPlayersForTeam}
                  startingBudget={startingBudget}
                  colorIndex={index}
                  onPlayerNotebookOpen={handlePlayerNotebookOpen}
                  readOnly
                />
              );
            })}
            {teams.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                No teams saved with this draft snapshot.
              </Text>
            ) : null}
            {copyError ? (
              <Text color="red.500" fontSize="sm">
                {copyError}
              </Text>
            ) : null}
          </Stack>
        </Stack>
      </Box>
      <AlertDialog
        isOpen={showOverrideWarning}
        leastDestructiveRef={cancelRef}
        onClose={() => setShowOverrideWarning(false)}
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
                ref={cancelRef}
                onClick={() => setShowOverrideWarning(false)}
              >
                Cancel
              </Button>
              <Button
                colorScheme="green"
                ml={3}
                onClick={() => void handleCopyDraft()}
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
