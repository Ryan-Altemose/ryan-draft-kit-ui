'use client';

import { Box, Heading } from '@chakra-ui/react';
import RankingsTable from './components/RankingsTable';
import { useNotebookManager } from '@/features/Notebook/hooks/useNotebookManager';
import NotebookWorkspace from '@/features/Notebook/components/NotebookWorkspace';
import type { Player as NotebookPlayer } from '@/features/Notebook/types/notebook.types';
import type { RankingsPlayer } from './components/RankingsTable';

export default function RankingsPage() {
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

  function handlePlayerClick(player: RankingsPlayer) {
    const notebookPlayer: NotebookPlayer = {
      _id: player._id,
      name: player.name,
      team: player.team,
      positions: player.positions,
      playerType: player.playerType,
      league: player.league,
      injuryStatus: player.injuryStatus,
      active: player.active,
      age: player.age,
      batSide: player.batSide,
      pitchHand: player.pitchHand,
    };
    openPlayerNotebook(notebookPlayer);
  }

  return (
    <Box p={8}>
      <Heading mb={6}>Scout Players</Heading>
      <RankingsTable onPlayerClick={handlePlayerClick} />
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
    </Box>
  );
}
