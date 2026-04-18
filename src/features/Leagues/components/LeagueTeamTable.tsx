'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import type {
  LeagueTeam,
  RosterSlots,
  TakenPlayer,
} from '../types/leagues.types';
import { DEFAULT_ROSTER_SLOTS, ROSTER_POSITIONS } from '../utils/leagueForm';
import { apiClient } from '@/shared/utils/api-client';

type LeagueTeamTableProps = {
  team: LeagueTeam;
  rosterSlots?: RosterSlots;
  takenPlayers?: TakenPlayer[];
  startingBudget: number;
  minorLeagueSlots?: number;
  onSaveChanges?: (payload: {
    teamName: string;
    rows: Array<{
      rowId: string;
      playerId: string;
      price: number;
    }>;
  }) => void;
  isSaving?: boolean;
};

type TeamTableRow = {
  rowId: string;
  position: string;
  playerId: string;
  search: string;
  team: string;
  price: string;
};

type Player = {
  _id: string;
  name: string;
  positions: string[];
  playerType: 'hitter' | 'pitcher';
  team: string;
  mlbDebutDate?: string;
};

type PlayersResponse = {
  data?: Player[];
  pagination?: {
    totalPages?: number;
  };
};

function formatPlayerDisplay(player: Player) {
  const words = player.name.trim().split(' ').filter(Boolean);
  if (words.length < 2) return player.name;

  const firstInitial = `${words[0][0]}.`;
  const lastName = words[words.length - 1];
  return `${firstInitial} ${lastName}`;
}

function isPlayerAllowedForRow(player: Player, position: string) {
  if (position === 'BENCH') return true;
  if (position === 'UTIL') return player.playerType === 'hitter';
  if (position === 'CI')
    return player.positions.includes('1B') || player.positions.includes('3B');
  if (position === 'MI')
    return player.positions.includes('2B') || player.positions.includes('SS');
  return player.positions.includes(position);
}

function buildTeamRows(
  rosterSlots: RosterSlots,
  takenPlayers: TakenPlayer[],
  minorLeagueSlots = 0,
): TeamTableRow[] {
  const regularRows = ROSTER_POSITIONS.flatMap((position) =>
    Array.from({ length: rosterSlots[position] ?? 0 }, (_, slotIndex) => {
      const rowId = `${position}-${slotIndex}`;
      const player = takenPlayers.find(
        ([, , positionSlot]) => positionSlot === rowId,
      );
      return {
        rowId,
        position,
        playerId: player?.[0] ?? '',
        search: '',
        team: '',
        price: String(player?.[3] ?? 0),
      };
    }),
  );

  const milbRows = Array.from({ length: minorLeagueSlots }, (_, slotIndex) => {
    const rowId = `MiLB-${slotIndex}`;
    const player = takenPlayers.find(
      ([, , positionSlot]) => positionSlot === rowId,
    );
    return {
      rowId,
      position: 'MiLB',
      playerId: player?.[0] ?? '',
      search: '',
      team: '',
      price: String(player?.[3] ?? 0),
    };
  });

  return [...regularRows, ...milbRows];
}

function parsePrice(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function calculateCurrentBudgetFromRows(
  startingBudget: number,
  rows: TeamTableRow[],
): number {
  const spent = rows.reduce((sum, row) => sum + parsePrice(row.price), 0);
  return Math.max(0, startingBudget - spent);
}

export default function LeagueTeamTable({
  team,
  rosterSlots = DEFAULT_ROSTER_SLOTS,
  takenPlayers = [],
  startingBudget,
  minorLeagueSlots = 0,
  onSaveChanges,
  isSaving = false,
}: LeagueTeamTableProps) {
  const toast = useToast();
  const [, teamName] = team;
  const propRows = useMemo(
    () => buildTeamRows(rosterSlots, takenPlayers, minorLeagueSlots),
    [rosterSlots, takenPlayers, minorLeagueSlots],
  );
  const [localTeamName, setLocalTeamName] = useState(teamName);
  const [localRows, setLocalRows] = useState(propRows);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  useEffect(() => {
    setLocalTeamName(teamName);
    setLocalRows(
      players.length > 0
        ? propRows.map((row) => {
            if (!row.playerId || row.search) return row;

            const matchingPlayer = players.find(
              (player) => player._id === row.playerId,
            );
            return matchingPlayer
              ? {
                  ...row,
                  search: formatPlayerDisplay(matchingPlayer),
                  team: matchingPlayer.team,
                }
              : row;
          })
        : propRows,
    );
  }, [propRows, teamName, players]);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        setIsLoadingPlayers(true);

        const firstPage = await apiClient.get<PlayersResponse>('/api/players', {
          params: { limit: 100, page: 1 },
        });
        const firstBatch = firstPage.data ?? [];
        const totalPages = firstPage.pagination?.totalPages ?? 1;
        const pageRequests: Promise<PlayersResponse>[] = [];

        for (let page = 2; page <= totalPages; page += 1) {
          pageRequests.push(
            apiClient.get<PlayersResponse>('/api/players', {
              params: { limit: 100, page },
            }),
          );
        }

        const remainingPages = await Promise.all(pageRequests);
        const allPlayers = [
          ...firstBatch,
          ...remainingPages.flatMap((page) => page.data ?? []),
        ];

        if (!active) return;
        setPlayers(allPlayers);
      } catch {
        if (active) {
          setPlayers([]);
        }
      } finally {
        if (active) {
          setIsLoadingPlayers(false);
        }
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (players.length === 0) return;

    setLocalRows((currentRows) =>
      currentRows.map((row) => {
        if (!row.playerId || row.search) return row;

        const matchingPlayer = players.find(
          (player) => player._id === row.playerId,
        );

        return matchingPlayer
          ? {
              ...row,
              search: formatPlayerDisplay(matchingPlayer),
              team: matchingPlayer.team,
            }
          : row;
      }),
    );
  }, [players]);

  const rows = localRows;
  const currentBudget = calculateCurrentBudgetFromRows(startingBudget, rows);

  // Player IDs taken by other teams in the league (excludes this team's own players)
  const [teamId] = team;
  const leagueTakenPlayerIds = useMemo(
    () =>
      new Set(
        takenPlayers
          .filter(([, takenByTeamId]) => takenByTeamId !== teamId)
          .map(([playerId]) => playerId),
      ),
    [takenPlayers, teamId],
  );

  // Returns IDs unavailable for a given row: league-wide taken + other slots in this table
  function getUnavailablePlayerIds(currentRowIndex: number): Set<string> {
    const ids = new Set(leagueTakenPlayerIds);
    rows.forEach((row, index) => {
      if (index !== currentRowIndex && row.playerId) {
        ids.add(row.playerId);
      }
    });
    return ids;
  }
  const isDirty =
    localTeamName !== teamName ||
    rows.some(
      (row, index) =>
        row.price !== propRows[index]?.price ||
        row.playerId !== propRows[index]?.playerId,
    );

  function handleLocalPriceChange(rowIndex: number, value: string) {
    if (value !== '' && !/^\d+$/.test(value)) return;

    setLocalRows((prev) => {
      const parsedValue = value === '' ? 0 : parsePrice(value);
      const spentWithoutRow = prev.reduce((sum, row, index) => {
        if (index === rowIndex) return sum;
        return sum + parsePrice(row.price);
      }, 0);
      const maxAllowed = Math.max(0, startingBudget - spentWithoutRow);

      if (parsedValue > maxAllowed) return prev;

      return prev.map((row, index) =>
        index === rowIndex ? { ...row, price: value } : row,
      );
    });
  }

  function handlePlayerSearchChange(rowIndex: number, value: string) {
    setLocalRows((prev) =>
      prev.map((row, index) => {
        if (index !== rowIndex) return row;

        // Build unavailable set from prev (fresh state) to avoid stale closure
        const unavailable = new Set(leagueTakenPlayerIds);
        prev.forEach((otherRow, otherIndex) => {
          if (otherIndex !== rowIndex && otherRow.playerId) {
            unavailable.add(otherRow.playerId);
          }
        });
        const allowedPlayers = players.filter(
          (player) =>
            (row.position === 'MiLB'
              ? !player.mlbDebutDate
              : isPlayerAllowedForRow(player, row.position)) &&
            !unavailable.has(player._id),
        );
        const exactMatch = allowedPlayers.find(
          (player) =>
            player.name === value || formatPlayerDisplay(player) === value,
        );

        return {
          ...row,
          search: exactMatch ? formatPlayerDisplay(exactMatch) : value,
          playerId: exactMatch?._id ?? '',
          team: exactMatch?.team ?? '',
        };
      }),
    );
  }

  function handleSaveChanges() {
    const invalidRows = rows.filter((row) => {
      const price = parsePrice(row.price);
      return (row.playerId && price <= 0) || (!row.playerId && price > 0);
    });

    if (invalidRows.length > 0) {
      toast({
        title: 'Incomplete row data.',
        description:
          'Each drafted row needs both a selected player and a price. Fix the missing field(s) and try again.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    onSaveChanges?.({
      teamName: localTeamName.trim() || teamName,
      rows: rows.map((row) => ({
        rowId: row.rowId,
        playerId: row.playerId,
        price: parsePrice(row.price),
      })),
    });
  }

  return (
    <Box
      w="100%"
      minW="0"
      maxW="100%"
      borderWidth="1px"
      borderRadius="md"
      overflow="hidden"
      bg="white"
    >
      <Flex
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={2}
        px={4}
        py={3}
        bg="gray.50"
        borderBottomWidth="1px"
      >
        <Input
          value={localTeamName}
          onChange={(e) => setLocalTeamName(e.target.value)}
          size="sm"
          maxW="180px"
          fontWeight="bold"
          bg="white"
          isDisabled={isSaving}
        />
        <Text fontWeight="semibold" color="gray.700">
          Budget: ${currentBudget}
        </Text>
      </Flex>

      <TableContainer w="auto">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Pos</Th>
              <Th>Player</Th>
              <Th>Team</Th>
              <Th isNumeric>Price</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((row, rowIndex) => (
              <Tr key={row.rowId}>
                <Td>{row.position}</Td>
                <Td>
                  <Input
                    size="sm"
                    bg="white"
                    value={row.search}
                    placeholder={
                      isLoadingPlayers
                        ? 'Loading players...'
                        : 'Search players...'
                    }
                    list={`player-options-${row.rowId}`}
                    onChange={(e) =>
                      handlePlayerSearchChange(rowIndex, e.target.value)
                    }
                    isDisabled={isSaving || isLoadingPlayers}
                  />
                  <datalist id={`player-options-${row.rowId}`}>
                    {players
                      .filter((player) => {
                        const unavailable = getUnavailablePlayerIds(rowIndex);
                        return (
                          (row.position === 'MiLB'
                            ? !player.mlbDebutDate
                            : isPlayerAllowedForRow(player, row.position)) &&
                          !unavailable.has(player._id)
                        );
                      })
                      .map((player) => (
                        <option key={player._id} value={player.name} />
                      ))}
                  </datalist>
                </Td>
                <Td>{row.team || '-'}</Td>
                <Td isNumeric>
                  <Input
                    type="number"
                    min={0}
                    max={startingBudget}
                    value={row.price}
                    onChange={(e) => {
                      handleLocalPriceChange(rowIndex, e.target.value);
                    }}
                    textAlign="right"
                    size="sm"
                    width="50px"
                    minWidth="50px"
                    marginLeft="auto"
                    isDisabled={isSaving || row.position === 'MiLB'}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {onSaveChanges ? (
        <Box px={4} py={3} borderTopWidth="1px" bg="gray.50">
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleSaveChanges}
            isLoading={isSaving}
            isDisabled={!isDirty}
          >
            Save Changes
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
