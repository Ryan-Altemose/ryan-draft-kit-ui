'use client';

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Badge, Box, Button, Flex, Text, Textarea } from '@chakra-ui/react';
import type { NotebookWindowRect, Player } from '../types/notebook.types';
import {
  NOTEBOOK_WINDOW_DEFAULT_HEIGHT,
  NOTEBOOK_WINDOW_DEFAULT_WIDTH,
  NOTEBOOK_WINDOW_MIN_HEIGHT,
  NOTEBOOK_WINDOW_MIN_WIDTH,
} from '../utils/notebookWindow';
import TopPlayersPanel from './TopPlayersPanel';

type NotebookWorkspaceProps = {
  selectedNotebookId: string | null;
  selectedNotebookName: string | null;
  selectedNotebookContent: string;
  onNotebookContentChange: (id: string, content: string) => void;
  onPlayerContentChange: (playerName: string, content: string) => void;
  selectedPlayerName: string | null;
  selectedPlayer: Player | null;
  onCloseNotebook: () => void;
  onOpenPlayerNotebook: (player: Player) => void;
};

export default function NotebookWorkspace({
  selectedNotebookId,
  selectedNotebookName,
  selectedNotebookContent,
  onNotebookContentChange,
  onPlayerContentChange,
  selectedPlayerName,
  selectedPlayer,
  onCloseNotebook,
  onOpenPlayerNotebook,
}: NotebookWorkspaceProps) {
  const [windowRect, setWindowRect] = useState<NotebookWindowRect>({
    x: 0,
    y: 0,
    width: NOTEBOOK_WINDOW_DEFAULT_WIDTH,
    height: NOTEBOOK_WINDOW_DEFAULT_HEIGHT,
  });
  const dragStateRef = useRef<{
    mode: 'move' | 'resize' | null;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    startHeight: 0,
  });

  useEffect(() => {
    if (!selectedNotebookName) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseNotebook();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCloseNotebook, selectedNotebookName]);

  useEffect(() => {
    if (!selectedNotebookName) {
      return;
    }

    const width = NOTEBOOK_WINDOW_DEFAULT_WIDTH;
    const height = NOTEBOOK_WINDOW_DEFAULT_HEIGHT;

    setWindowRect({
      width,
      height,
      x: Math.max((window.innerWidth - width) / 2, 24),
      y: Math.max((window.innerHeight - height) / 2, 24),
    });
  }, [selectedNotebookName]);

  useEffect(() => {
    if (!selectedNotebookName) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;

      if (dragState.mode === 'move') {
        setWindowRect((current) => ({
          ...current,
          x: Math.max(
            dragState.startLeft + event.clientX - dragState.startX,
            0,
          ),
          y: Math.max(dragState.startTop + event.clientY - dragState.startY, 0),
        }));
      }

      if (dragState.mode === 'resize') {
        setWindowRect((current) => ({
          ...current,
          width: Math.max(
            dragState.startWidth + event.clientX - dragState.startX,
            NOTEBOOK_WINDOW_MIN_WIDTH,
          ),
          height: Math.max(
            dragState.startHeight + event.clientY - dragState.startY,
            NOTEBOOK_WINDOW_MIN_HEIGHT,
          ),
        }));
      }
    };

    const handleMouseUp = () => {
      dragStateRef.current.mode = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedNotebookName]);

  const startMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      mode: 'move',
      startX: event.clientX,
      startY: event.clientY,
      startLeft: windowRect.x,
      startTop: windowRect.y,
      startWidth: windowRect.width,
      startHeight: windowRect.height,
    };
  };

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    dragStateRef.current = {
      mode: 'resize',
      startX: event.clientX,
      startY: event.clientY,
      startLeft: windowRect.x,
      startTop: windowRect.y,
      startWidth: windowRect.width,
      startHeight: windowRect.height,
    };
  };

  return (
    <>
      <Box
        flex="1"
        borderRadius="md"
        border="2px solid"
        borderColor="gray.200"
        bg="white"
        p={6}
      >
        <Flex direction="column" gap={6} h="100%">
          <TopPlayersPanel onOpenPlayer={onOpenPlayerNotebook} />
          <Box
            flex="1"
            borderRadius="md"
            border="1px dashed"
            borderColor="gray.200"
          />
        </Flex>
      </Box>

      {selectedNotebookName ? (
        <Box position="fixed" inset={0} bg="blackAlpha.200" zIndex={10}>
          <Box
            w={`${windowRect.width}px`}
            h={`${windowRect.height}px`}
            borderRadius="md"
            border="2px solid"
            borderColor="gray.200"
            bg="white"
            p={5}
            position="absolute"
            left={`${windowRect.x}px`}
            top={`${windowRect.y}px`}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={4}
              cursor="move"
              onMouseDown={startMove}
            >
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                {selectedNotebookName}
              </Text>
              <Button
                size="xs"
                variant="ghost"
                minW="auto"
                h="24px"
                px={2}
                onClick={onCloseNotebook}
              >
                X
              </Button>
            </Box>
            {selectedNotebookId !== null ? (
              <Textarea
                h={`calc(${windowRect.height}px - 88px)`}
                minH="140px"
                resize="none"
                value={selectedNotebookContent}
                onChange={(event) =>
                  onNotebookContentChange(
                    selectedNotebookId,
                    event.target.value,
                  )
                }
                placeholder="Write notes here..."
              />
            ) : selectedPlayerName ? (
              <Flex
                direction="column"
                gap={4}
                h={`calc(${windowRect.height}px - 88px)`}
              >
                <Box
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="gray.50"
                  p={3}
                >
                  <Flex align="center" justify="space-between" gap={3} mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Player Stats
                    </Text>
                    <Badge
                      colorScheme={
                        selectedPlayer?.injuryStatus === 'active'
                          ? 'green'
                          : 'red'
                      }
                      textTransform="capitalize"
                    >
                      {selectedPlayer?.injuryStatus ?? 'unknown'}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.600">
                    Team: {selectedPlayer?.team ?? '-'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Positions: {selectedPlayer?.positions.join(', ') ?? '-'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    League: {selectedPlayer?.league ?? '-'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Type: {selectedPlayer?.playerType ?? '-'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Age: {selectedPlayer?.age ?? '-'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Bats/Throws:{' '}
                    {selectedPlayer?.batSide ??
                      selectedPlayer?.pitchHand ??
                      '-'}
                  </Text>
                </Box>
                <Textarea
                  flex="1"
                  minH="120px"
                  resize="none"
                  value={selectedNotebookContent}
                  onChange={(event) =>
                    onPlayerContentChange(
                      selectedPlayerName,
                      event.target.value,
                    )
                  }
                  placeholder="Write notes here..."
                />
              </Flex>
            ) : null}
            <Box
              position="absolute"
              right={1}
              bottom={1}
              w="16px"
              h="16px"
              cursor="nwse-resize"
              onMouseDown={startResize}
            />
          </Box>
        </Box>
      ) : null}
    </>
  );
}
