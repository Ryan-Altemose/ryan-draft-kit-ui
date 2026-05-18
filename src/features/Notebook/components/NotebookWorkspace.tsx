'use client';

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import type { NotebookWindowRect, Player } from '../types/notebook.types';
import { computeProjectedStats } from '../utils/computeProjectedStats';
import {
  NOTEBOOK_WINDOW_DEFAULT_HEIGHT,
  NOTEBOOK_WINDOW_DEFAULT_WIDTH,
  NOTEBOOK_WINDOW_MIN_HEIGHT,
  NOTEBOOK_WINDOW_MIN_WIDTH,
} from '../utils/notebookWindow';
import TopPlayersPanel from './TopPlayersPanel';

const DEPTH_COLORS: Record<string, string> = {
  starter: 'green',
  backup: 'blue',
  reserve: 'orange',
  minors: 'gray',
};

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
  showLauncher?: boolean;
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
  showLauncher = true,
}: NotebookWorkspaceProps) {
  const averagedStats =
    selectedPlayer?.stats !== undefined
      ? computeProjectedStats(selectedPlayer)
      : null;
  const formatDepthChart = (): string => {
    if (!selectedPlayer?.depthChartStatus && !selectedPlayer?.depthChartOrder) {
      return '-';
    }

    if (selectedPlayer?.depthChartStatus && selectedPlayer?.depthChartOrder) {
      return `${selectedPlayer.depthChartStatus} (#${selectedPlayer.depthChartOrder})`;
    }

    return (
      selectedPlayer?.depthChartStatus ??
      String(selectedPlayer?.depthChartOrder ?? '-')
    );
  };

  const formatStatNumber = (key: string, value: number): string => {
    const lower = key.toLowerCase();
    if (lower === 'ba' || lower === 'avg') return value.toFixed(3);
    if (lower === 'era') return value.toFixed(2);
    return parseFloat(value.toFixed(2)).toString();
  };

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
      {showLauncher ? (
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
      ) : null}

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
                focusBorderColor="green.400"
              />
            ) : selectedPlayerName ? (
              <Box
                display="grid"
                gridTemplateColumns="1fr 1fr"
                gridTemplateRows="auto 1fr"
                gap={3}
                h={`calc(${windowRect.height}px - 88px)`}
                minH="140px"
              >
                {/* Top-left: Player info */}
                <Box
                  borderWidth="1px"
                  borderColor="green.200"
                  borderRadius="md"
                  bg="white"
                  p={3}
                  overflow="hidden"
                  boxShadow="sm"
                  _hover={{ borderColor: 'green.400' }}
                >
                  <Flex align="center" justify="space-between" gap={3} mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Player Info
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
                  <Box
                    display="grid"
                    gridTemplateColumns="1fr 1fr"
                    gap={1}
                    fontSize="sm"
                    color="gray.600"
                  >
                    <Text>Team: {selectedPlayer?.team ?? '-'}</Text>
                    <Text>League: {selectedPlayer?.league ?? '-'}</Text>
                    <Text>
                      Positions: {selectedPlayer?.positions.join(', ') ?? '-'}
                    </Text>
                    <Text>Type: {selectedPlayer?.playerType ?? '-'}</Text>
                    <Text>
                      Depth Chart:{' '}
                      {selectedPlayer?.depthChartStatus ? (
                        <Badge
                          colorScheme={
                            DEPTH_COLORS[selectedPlayer.depthChartStatus] ??
                            'gray'
                          }
                          fontSize="xs"
                          ml={1}
                        >
                          {formatDepthChart()}
                        </Badge>
                      ) : (
                        formatDepthChart()
                      )}
                    </Text>
                    <Text>Age: {selectedPlayer?.age ?? '-'}</Text>
                    <Text>
                      Bats/Throws:{' '}
                      {selectedPlayer?.batSide ??
                        selectedPlayer?.pitchHand ??
                        '-'}
                    </Text>
                  </Box>
                </Box>

                {/* Top-right: Real stats */}
                <Box
                  borderWidth="1px"
                  borderColor="green.200"
                  borderRadius="md"
                  overflow="hidden"
                  minH="0"
                  boxShadow="sm"
                  _hover={{ borderColor: 'green.400' }}
                >
                  <Flex
                    px={3}
                    py={2}
                    bg="green.50"
                    borderBottomWidth={
                      selectedPlayer?.stats?.length ? '1px' : undefined
                    }
                    borderColor="green.200"
                    align="center"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.600"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      Stats
                    </Text>
                  </Flex>
                  {selectedPlayer?.stats?.length ? (
                    (() => {
                      const seasons = [...selectedPlayer.stats].sort((a, b) =>
                        String(b.season).localeCompare(String(a.season)),
                      );

                      const playerType =
                        selectedPlayer?.playerType === 'pitcher'
                          ? 'pitcher'
                          : 'hitter';

                      const statKeys = Array.from(
                        new Set(
                          seasons.flatMap((s) => Object.keys(s.data ?? {})),
                        ),
                      ).sort();

                      if (playerType === 'pitcher') {
                        const withoutWinsLosses = statKeys.filter(
                          (k) => k !== 'wins' && k !== 'losses',
                        );
                        if (statKeys.includes('wins'))
                          withoutWinsLosses.push('wins');
                        if (statKeys.includes('losses'))
                          withoutWinsLosses.push('losses');
                        statKeys.splice(
                          0,
                          statKeys.length,
                          ...withoutWinsLosses,
                        );
                      }

                      const headerLabel = (key: string) => key.toUpperCase();

                      return (
                        <TableContainer overflowY="auto" maxH="100%">
                          <Table size="sm" variant="simple">
                            <Thead
                              position="sticky"
                              top={0}
                              bg="white"
                              zIndex={1}
                            >
                              <Tr>
                                <Th>Year</Th>
                                {statKeys.map((key) => (
                                  <Th key={key} isNumeric>
                                    {headerLabel(key)}
                                  </Th>
                                ))}
                              </Tr>
                            </Thead>
                            <Tbody>
                              {seasons.map((seasonRow, rowIndex) => (
                                <Tr
                                  key={`${seasonRow.type}-${seasonRow.season}-${rowIndex}`}
                                >
                                  <Td>{seasonRow.season}</Td>
                                  {statKeys.map((key) => {
                                    const value = seasonRow.data?.[key];
                                    const display =
                                      value === undefined || value === null
                                        ? '-'
                                        : typeof value === 'number'
                                          ? formatStatNumber(key, value)
                                          : String(value);
                                    return (
                                      <Td
                                        key={`${seasonRow.season}-${key}`}
                                        isNumeric
                                      >
                                        {display}
                                      </Td>
                                    );
                                  })}
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      );
                    })()
                  ) : (
                    <Text fontSize="xs" color="gray.400" px={3} py={3}>
                      Stats not yet available
                    </Text>
                  )}
                </Box>

                {/* Bottom-left: Projections (placeholder) */}
                <Box
                  borderWidth="1px"
                  borderColor="green.200"
                  borderRadius="md"
                  overflow="hidden"
                  boxShadow="sm"
                  _hover={{ borderColor: 'green.400' }}
                  display="flex"
                  flexDirection="column"
                >
                  <Flex
                    px={3}
                    py={2}
                    bg="green.50"
                    borderBottomWidth="1px"
                    borderColor="green.200"
                    align="center"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.600"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      Projections
                    </Text>
                  </Flex>
                  <TableContainer overflowY="auto" maxH="calc(100% - 33px)">
                    <Table size="sm" variant="simple">
                      <Thead position="sticky" top={0} bg="white" zIndex={1}>
                        <Tr>
                          <Th>Stat</Th>
                          <Th isNumeric>Proj</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {(() => {
                          const playerType =
                            selectedPlayer?.playerType === 'pitcher'
                              ? 'pitcher'
                              : 'hitter';

                          const fallbackKeys =
                            playerType === 'pitcher'
                              ? [
                                  'innings',
                                  'strikeouts',
                                  'wins',
                                  'losses',
                                  'saves',
                                  'era',
                                ]
                              : ['ba', 'hr', 'rbi', 'walk', 'sb'];

                          const projectionKeys =
                            averagedStats &&
                            Object.keys(averagedStats).length > 0
                              ? Object.keys(averagedStats).sort()
                              : fallbackKeys;

                          return projectionKeys.map((key) => (
                            <Tr key={key}>
                              <Td>{key.toUpperCase()}</Td>
                              <Td isNumeric>
                                {averagedStats?.[key] !== undefined
                                  ? formatStatNumber(key, averagedStats[key])
                                  : '-'}
                              </Td>
                            </Tr>
                          ));
                        })()}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Bottom-right: Notes */}
                <Textarea
                  minH="0"
                  h="100%"
                  alignSelf="stretch"
                  resize="none"
                  value={selectedNotebookContent}
                  onChange={(event) =>
                    onPlayerContentChange(
                      selectedPlayerName,
                      event.target.value,
                    )
                  }
                  placeholder="Write notes here..."
                  focusBorderColor="green.400"
                  borderColor="green.200"
                  _hover={{ borderColor: 'green.400' }}
                />
              </Box>
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
