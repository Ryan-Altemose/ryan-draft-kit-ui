'use client';

import { Box, Button, Flex, Heading, VStack } from '@chakra-ui/react';
import type { NotebookListEntry } from '../types/notebook.types';
import NotebookListItem from './NotebookListItem';

type NotebookListPanelProps = {
  notebooks: NotebookListEntry[];
  selectedNotebookId: string | null;
  onAddNotebook: () => void;
  onRenameNotebook: (id: string, name: string) => void;
  onDeleteNotebook: (id: string) => void;
  onOpenNotebook: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
};

export default function NotebookListPanel({
  notebooks,
  selectedNotebookId,
  onAddNotebook,
  onRenameNotebook,
  onDeleteNotebook,
  onOpenNotebook,
  isLoading,
  error,
}: NotebookListPanelProps) {
  return (
    <Box flex="1">
      <Flex mb={6} align="center" justify="space-between">
        <Heading>Notebooks per game</Heading>
        <Button
          bg="green.600"
          color="white"
          _hover={{ bg: 'green.700' }}
          onClick={onAddNotebook}
        >
          +
        </Button>
      </Flex>

      <VStack align="stretch" spacing={5}>
        {isLoading ? <Box color="gray.500">Loading notebooks...</Box> : null}
        {error ? <Box color="red.500">{error}</Box> : null}
        {notebooks.map((notebook) => (
          <NotebookListItem
            key={notebook._id}
            notebook={notebook}
            isSelected={notebook._id === selectedNotebookId}
            onRename={onRenameNotebook}
            onDelete={onDeleteNotebook}
            onOpen={onOpenNotebook}
          />
        ))}
      </VStack>
    </Box>
  );
}
