'use client';

import { useState } from 'react';
import { Box, Button, Input, Text } from '@chakra-ui/react';
import type { NotebookListEntry } from '../types/notebook.types';

type NotebookListItemProps = {
  notebook: NotebookListEntry;
  isSelected: boolean;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
};

export default function NotebookListItem({
  notebook,
  isSelected,
  onRename,
  onDelete,
  onOpen,
}: NotebookListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(notebook.name);

  const commitRename = () => {
    const trimmedName = draftName.trim();
    onRename(notebook._id, trimmedName || notebook.name);
    setDraftName(trimmedName || notebook.name);
    setIsEditing(false);
  };

  return (
    <Box
      w="100%"
      minH="88px"
      px={6}
      borderRadius="md"
      border="2px solid"
      borderColor={isSelected ? 'green.600' : 'gray.200'}
      bg="white"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
      transition="all 0.15s ease"
      cursor="default"
      onDoubleClick={() => onOpen(notebook._id)}
    >
      {isEditing ? (
        <Input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitRename();
            }
          }}
          onClick={(event) => event.stopPropagation()}
          autoFocus
        />
      ) : (
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          {notebook.name}
        </Text>
      )}

      {!isEditing ? (
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            size="sm"
            variant="ghost"
            color="gray.600"
            onClick={(event) => {
              event.stopPropagation();
              setDraftName(notebook.name);
              setIsEditing(true);
            }}
          >
            Rename
          </Button>
          <Button
            size="sm"
            variant="ghost"
            color="red.500"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(notebook._id);
            }}
          >
            Delete
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
