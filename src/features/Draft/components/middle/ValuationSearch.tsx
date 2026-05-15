'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
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
import { externalApiClient } from '@/shared/utils/api-client';
import type { Player as NotebookPlayer } from '@/features/Notebook/types/notebook.types';

type Player = {
  _id: string;
  name: string;
  team: string;
  positions: string[];
  injuryStatus: string;
};

type PlayersResponse = {
  data?: Player[];
  pagination?: {
    totalPages?: number;
  };
};

type SortKey = 'name' | 'value';
type SortDir = 'asc' | 'desc' | null;

type ValuationSearchProps = {
  valuations?: Record<string, number>;
  onPlayerClick?: (player: NotebookPlayer) => void;
};

export default function ValuationSearch({
  valuations = {},
  onPlayerClick,
}: ValuationSearchProps) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setIsLoading(true);
      setError(null);

      try {
        const firstPage = await externalApiClient.get<PlayersResponse>(
          '/api/players',
          { params: { limit: 100, page: 1 } },
        );
        const firstBatch = firstPage.data ?? [];
        const totalPages = firstPage.pagination?.totalPages ?? 1;

        const pageRequests: Promise<PlayersResponse>[] = [];
        for (let page = 2; page <= totalPages; page += 1) {
          pageRequests.push(
            externalApiClient.get<PlayersResponse>('/api/players', {
              params: { limit: 100, page },
            }),
          );
        }

        const remainingPages = await Promise.all(pageRequests);
        const allData = [
          ...firstBatch,
          ...remainingPages.flatMap((p) => p.data ?? []),
        ];

        if (!active || allData.length === 0) {
          setError('Failed to retrieve player data');
          return;
        }

        const sorted = allData.slice().sort((a, b) => {
          const lastA = a.name.split(' ').pop() ?? '';
          const lastB = b.name.split(' ').pop() ?? '';
          return lastA.localeCompare(lastB);
        });

        setAllPlayers(sorted);
        setPositions(
          Array.from(new Set(allData.flatMap((p) => p.positions))).sort(),
        );
      } catch {
        if (active) setError('Failed to retrieve player data');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPlayers();
    return () => {
      active = false;
    };
  }, []);

  const displayed = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const filtered = allPlayers.filter((p) => {
      const matchesSearch =
        !normalized || p.name.toLowerCase().includes(normalized);
      const matchesPosition =
        !selectedPosition || p.positions.includes(selectedPosition);
      return matchesSearch && matchesPosition;
    });

    if (sortKey && sortDir) {
      filtered.sort((a, b) => {
        if (sortKey === 'value') {
          const valA = valuations[a._id] ?? -Infinity;
          const valB = valuations[b._id] ?? -Infinity;
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        if (sortKey === 'name') {
          const lastA = a.name.split(' ').pop() ?? '';
          const lastB = b.name.split(' ').pop() ?? '';
          const cmp = lastA.localeCompare(lastB);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }

    return filtered.slice(0, 50);
  }, [searchTerm, selectedPosition, sortKey, sortDir, allPlayers, valuations]);

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

  if (error) {
    return (
      <Text fontSize="sm" color="red.500">
        {error}
      </Text>
    );
  }

  return (
    <Box display="flex" flexDirection="column" h="100%" overflow="hidden">
      <InputGroup size="sm" mb={2} flexShrink={0}>
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

      <Wrap mb={2} spacing={1} flexShrink={0}>
        <WrapItem>
          <Button
            colorScheme={selectedPosition === null ? 'green' : 'gray'}
            onClick={() => setSelectedPosition(null)}
            size="xs"
          >
            All
          </Button>
        </WrapItem>
        {positions.map((position) => (
          <WrapItem key={position}>
            <Button
              colorScheme={selectedPosition === position ? 'green' : 'gray'}
              onClick={() => setSelectedPosition(position)}
              size="xs"
            >
              {position}
            </Button>
          </WrapItem>
        ))}
      </Wrap>

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
                onClick={() => onPlayerClick?.({ ...player })}
                cursor={onPlayerClick ? 'pointer' : undefined}
                _hover={{ bg: 'green.100' }}
              >
                <Td>{player.name}</Td>
                <Td>{player.team}</Td>
                <Td>{player.positions.join(', ')}</Td>
                <Td>
                  {valuations[player._id] !== undefined
                    ? `$${valuations[player._id]}`
                    : '-'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
