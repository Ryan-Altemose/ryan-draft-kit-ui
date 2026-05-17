'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { usePlayers } from '@/shared/hooks/usePlayers';
import type { Player as NotebookPlayer } from '@/features/Notebook/types/notebook.types';
import type { TakenPlayer } from '@/features/Leagues/types/leagues.types';

type SortKey = 'name' | 'value';
type SortDir = 'asc' | 'desc' | null;

type ValuationSearchProps = {
  valuations?: Record<string, number>;
  isLoadingValuations?: boolean;
  takenPlayers?: TakenPlayer[];
  leagueType?: 'MLB' | 'AL' | 'NL';
  onPlayerClick?: (player: NotebookPlayer) => void;
};

export default function ValuationSearch({
  valuations = {},
  isLoadingValuations = false,
  takenPlayers = [],
  leagueType,
  onPlayerClick,
}: ValuationSearchProps) {
  const { players: allPlayers, isLoading } = usePlayers();
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>('value');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const positions = useMemo(
    () => Array.from(new Set(allPlayers.flatMap((p) => p.positions))).sort(),
    [allPlayers],
  );

  const displayed = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const takenIds = new Set(takenPlayers.map(([playerId]) => playerId));
    const filtered = allPlayers.filter((p) => {
      if (takenIds.has(p._id)) return false;
      if (leagueType && leagueType !== 'MLB' && p.league !== leagueType) {
        return false;
      }
      const matchesSearch =
        !normalized || p.name.toLowerCase().includes(normalized);
      const matchesPosition =
        selectedPositions.length === 0 ||
        selectedPositions.some((pos) => p.positions.includes(pos));
      return matchesSearch && matchesPosition;
    });

    if (sortKey && sortDir) {
      filtered.sort((a, b) => {
        if (sortKey === 'value') {
          const valA = valuations[a._id] ?? -Infinity;
          const valB = valuations[b._id] ?? -Infinity;
          if (valA !== valB)
            return sortDir === 'asc' ? valA - valB : valB - valA;

          // Stable fallback when values are equal/undefined: last name sorting
          const lastA = a.name.split(' ').pop() ?? '';
          const lastB = b.name.split(' ').pop() ?? '';
          return lastA.localeCompare(lastB);
        }
        if (sortKey === 'name') {
          const lastA = a.name.split(' ').pop() ?? '';
          const lastB = b.name.split(' ').pop() ?? '';
          const cmp = lastA.localeCompare(lastB);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    } else {
      filtered.sort((a, b) => {
        const lastA = a.name.split(' ').pop() ?? '';
        const lastB = b.name.split(' ').pop() ?? '';
        return lastA.localeCompare(lastB);
      });
    }

    return filtered.slice(0, 50);
  }, [
    searchTerm,
    selectedPositions,
    sortKey,
    sortDir,
    allPlayers,
    valuations,
    takenPlayers,
    leagueType,
  ]);

  function handleHeaderClick(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key || !sortDir) return null;
    return (
      <Text as="span" ml={1} fontSize="10px">
        {sortDir === 'asc' ? '▲' : '▼'}
      </Text>
    );
  }

  if (isLoading) {
    return (
      <Box py={4} textAlign="center">
        <Spinner size="sm" />
      </Box>
    );
  }

  if (allPlayers.length === 0) {
    return (
      <Text fontSize="sm" color="red.500">
        Failed to retrieve player data
      </Text>
    );
  }

  return (
    <Box display="flex" flexDirection="column" h="100%" overflow="hidden">
      <Flex gap={2} mb={2} align="center" flexShrink={0}>
        <InputGroup size="sm" flex="1">
          <Input
            placeholder="Search player..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <InputRightElement>
            <IconButton
              aria-label="Search"
              icon={
                <Icon viewBox="0 0 24 24">
                  <path
                    d="M10.5 3a7.5 7.5 0 1 0 4.73 13.32l4.22 4.21 1.06-1.06-4.21-4.22A7.5 7.5 0 0 0 10.5 3Zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
                    fill="currentColor"
                  />
                </Icon>
              }
              size="xs"
              variant="ghost"
            />
          </InputRightElement>
        </InputGroup>

        <Wrap spacing={1}>
          <WrapItem>
            <Button
              colorScheme={selectedPositions.length === 0 ? 'green' : 'gray'}
              onClick={() => setSelectedPositions([])}
              size="xs"
            >
              All
            </Button>
          </WrapItem>
          {positions.map((position) => (
            <WrapItem key={position}>
              <Button
                colorScheme={
                  selectedPositions.includes(position) ? 'green' : 'gray'
                }
                onClick={() =>
                  setSelectedPositions((prev) =>
                    prev.includes(position)
                      ? prev.filter((p) => p !== position)
                      : [...prev, position],
                  )
                }
                size="xs"
              >
                {position}
              </Button>
            </WrapItem>
          ))}
        </Wrap>
      </Flex>

      <TableContainer overflowY="auto" flex="1">
        <Table size="sm" variant="simple">
          <Thead position="sticky" top={0} bg="white" zIndex={1}>
            <Tr>
              <Th
                cursor="pointer"
                userSelect="none"
                onClick={() => handleHeaderClick('name')}
                color={sortKey === 'name' ? 'green' : undefined}
                _hover={{ bg: 'green.100' }}
              >
                Name{sortIndicator('name')}
              </Th>
              <Th>Team</Th>
              <Th>Pos</Th>
              <Th
                cursor="pointer"
                userSelect="none"
                onClick={() => handleHeaderClick('value')}
                color={sortKey === 'value' ? 'green' : undefined}
                _hover={{ bg: 'green.100' }}
              >
                $ Value{sortIndicator('value')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {displayed.map((player) => (
              <Tr
                key={player._id}
                onClick={() =>
                  onPlayerClick?.({
                    ...player,
                    injuryStatus: player.injuryStatus ?? '',
                  })
                }
                cursor={onPlayerClick ? 'pointer' : undefined}
                _hover={{ bg: 'green.100' }}
              >
                <Td>{player.name}</Td>
                <Td>{player.team}</Td>
                <Td>{player.positions.join(', ')}</Td>
                <Td>
                  {isLoadingValuations ? (
                    <Spinner size="xs" color="gray.400" />
                  ) : valuations[player._id] !== undefined ? (
                    `$${valuations[player._id]}`
                  ) : (
                    '-'
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
