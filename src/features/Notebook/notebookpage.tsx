'use client';

import { Alert, AlertIcon, Box, Flex } from '@chakra-ui/react';
import NotebookListPanel from './components/NotebookListPanel';
import NotebookWorkspace from './components/NotebookWorkspace';
import { useNotebookManager } from './hooks/useNotebookManager';

export default function NotebookPage() {
  const {
    notebooks,
    selectedNotebookId,
    selectedNotebookName,
    selectedNotebookContent,
    selectedPlayerName,
    selectedPlayer,
    isLoadingNotebooks,
    notebooksError,
    saveError,
    addNotebook,
    renameNotebook,
    removeNotebook,
    updateNotebookContent,
    updatePlayerContent,
    openNotebook,
    openPlayerNotebook,
    closeNotebook,
  } = useNotebookManager();

  return (
    <Box p={8}>
      {saveError ? (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {saveError}
        </Alert>
      ) : null}
      <Flex gap={8} align="stretch" minH="calc(100vh - 140px)">
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
        />
        <NotebookListPanel
          notebooks={notebooks}
          selectedNotebookId={selectedNotebookId}
          onAddNotebook={addNotebook}
          onRenameNotebook={renameNotebook}
          onDeleteNotebook={removeNotebook}
          isLoading={isLoadingNotebooks}
          error={notebooksError}
          onOpenNotebook={openNotebook}
        />
      </Flex>
    </Box>
  );
}
