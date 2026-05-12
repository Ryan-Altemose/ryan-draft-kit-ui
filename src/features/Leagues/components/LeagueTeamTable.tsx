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
import { getTeamColor } from '../utils/teamColors';
import { usePlayers } from '@/shared/hooks/usePlayers';
import { formatPlayerDisplay } from '@/shared/utils/format';
import PlayerSearchInput from '@/shared/components/ui/PlayerSearchInput';

type LeagueTeamTableProps = {
  team: LeagueTeam;
  rosterSlots?: RosterSlots;
  takenPlayers?: TakenPlayer[];
  allTakenPlayers?: TakenPlayer[];
  startingBudget: number;
  leagueType?: 'MLB' | 'AL' | 'NL';
  onSaveChanges?: (payload: {
    teamName: string;
    rows: Array<{
      rowId: string;
      playerId: string;
      price: number;
      contract: string;
    }>;
  }) => void;
  onDirtyChange?: (teamId: string, isDirty: boolean) => void;
  onRowsChange?: (
    teamId: string,
    rows: Array<{
      rowId: string;
      playerId: string;
      price: number;
      contract: string;
    }>,
  ) => void;
  onCrossTeamTransfer?: (playerId: string, destTeamId: string) => void;
  forcedEmptyPlayerIds?: Set<string>;
  isSaving?: boolean;
  readOnly?: boolean;
  draftMode?: boolean;
  colorIndex?: number;
};

type TeamTableRow = {
  rowId: string;
  position: string;
  playerId: string;
  search: string;
  team: string;
  price: string;
  contract: string;
};

function buildTeamRows(
  rosterSlots: RosterSlots,
  takenPlayers: TakenPlayer[],
): TeamTableRow[] {
  return ROSTER_POSITIONS.flatMap((position) =>
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
        contract: player?.[4] ?? '',
      };
    }),
  );
}

function parsePrice(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function calculateCurrentBudgetFromRows(
  startingBudget: number,
  rows: TeamTableRow[],
  takenPlayers: TakenPlayer[],
): number {
  const rowSlots = new Set(rows.map((r) => r.rowId));
  const rowSpend = rows.reduce((sum, row) => sum + parsePrice(row.price), 0);
  // Also deduct spending from taken players whose slot has no corresponding row
  // (e.g. 'DRAFT' sentinel entries from live auction picks)
  const extraSpend = takenPlayers
    .filter(([, , slot]) => !rowSlots.has(slot))
    .reduce((sum, [, , , price]) => sum + price, 0);
  return Math.max(0, startingBudget - rowSpend - extraSpend);
}

export default function LeagueTeamTable({
  team,
  rosterSlots = DEFAULT_ROSTER_SLOTS,
  takenPlayers = [],
  allTakenPlayers,
  startingBudget,
  leagueType,
  onSaveChanges,
  onDirtyChange,
  onRowsChange,
  onCrossTeamTransfer,
  forcedEmptyPlayerIds,
  isSaving = false,
  readOnly = false,
  draftMode = false,
  colorIndex,
}: LeagueTeamTableProps) {
  const toast = useToast();
  const [teamId, teamName] = team;
  const propRows = useMemo(
    () => buildTeamRows(rosterSlots, takenPlayers),
    [rosterSlots, takenPlayers],
  );
  const [localTeamName, setLocalTeamName] = useState(teamName);
  const [localRows, setLocalRows] = useState(propRows);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { players, isLoading: isLoadingPlayers } = usePlayers();

  useEffect(() => {
    setLocalTeamName(teamName);
    const takenIds = new Set(
      (allTakenPlayers ?? takenPlayers).map(([id]) => id),
    );
    setLocalRows((currentRows) =>
      propRows.map((propRow, index) => {
        const localRow = currentRows[index];
        // Local pick was claimed by another team — clear it
        if (
          !draftMode &&
          localRow?.playerId &&
          localRow.playerId !== propRow.playerId &&
          takenIds.has(localRow.playerId)
        ) {
          return { ...propRow, search: '', team: '', price: '0' };
        }
        // Preserve other unsaved local changes
        if (localRow?.playerId && localRow.playerId !== propRow.playerId) {
          // If the player no longer exists anywhere in the league, the local row
          // is stale (e.g. from initializing off stale cache before a refetch
          // brought in fresh data after an undo). Sync from prop instead.
          if (!takenIds.has(localRow.playerId)) {
            return { ...propRow, search: '', team: '', price: '0' };
          }
          return localRow;
        }
        // Sync display info for saved data
        if (!propRow.playerId || players.length === 0) {
          return propRow;
        }
        const matchingPlayer = players.find((p) => p._id === propRow.playerId);
        return matchingPlayer
          ? {
              ...propRow,
              search: formatPlayerDisplay(matchingPlayer),
              team: matchingPlayer.team,
              contract: localRow?.contract ?? '',
            }
          : propRow;
      }),
    );
  }, [propRows, teamName, players, allTakenPlayers, takenPlayers, draftMode]);

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
  const currentBudget = calculateCurrentBudgetFromRows(
    startingBudget,
    rows,
    takenPlayers,
  );

  // All player IDs already taken anywhere in the league
  const takenPlayersForAvailability = allTakenPlayers ?? takenPlayers;
  const leagueTakenPlayerIds = useMemo(
    () => new Set(takenPlayersForAvailability.map(([playerId]) => playerId)),
    [takenPlayersForAvailability],
  );

  const playerSalaryMap = useMemo(
    () =>
      new Map(
        (allTakenPlayers ?? takenPlayers).map(([pid, , , price]) => [
          pid,
          price,
        ]),
      ),
    [allTakenPlayers, takenPlayers],
  );

  const teamPlayerIds = useMemo(
    () => new Set(localRows.map((r) => r.playerId).filter(Boolean)),
    [localRows],
  );

  // In draft mode, show all drafted players across the league (to support trades),
  // but exclude cross-team players whose salary exceeds this team's remaining budget.
  // Same-team players are always shown since rearranging them doesn't change total spend.
  const availablePlayers = draftMode
    ? players
        .filter((p) => leagueTakenPlayerIds.has(p._id))
        .filter(
          (p) =>
            teamPlayerIds.has(p._id) ||
            (playerSalaryMap.get(p._id) ?? 0) <= currentBudget,
        )
    : players;

  // Returns IDs unavailable for a given row: league-wide taken + other slots in this table
  function getUnavailablePlayerIds(currentRowIndex: number): Set<string> {
    if (draftMode) return new Set();
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
        row.playerId !== propRows[index]?.playerId ||
        row.contract !== propRows[index]?.contract,
    );

  useEffect(() => {
    onDirtyChange?.(teamId, isDirty);
  }, [teamId, isDirty, onDirtyChange]);

  useEffect(() => {
    onRowsChange?.(
      teamId,
      localRows.map((row) => ({
        rowId: row.rowId,
        playerId: row.playerId,
        price: parsePrice(row.price),
        contract: row.contract,
      })),
    );
  }, [teamId, localRows, onRowsChange]);

  useEffect(() => {
    if (!forcedEmptyPlayerIds || forcedEmptyPlayerIds.size === 0) return;
    setLocalRows((prev) =>
      prev.map((row) =>
        row.playerId && forcedEmptyPlayerIds.has(row.playerId)
          ? { ...row, playerId: '', search: '', team: '', price: '0' }
          : row,
      ),
    );
  }, [forcedEmptyPlayerIds]);

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

  function handlePlayerSearchChange(
    rowIndex: number,
    searchText: string,
    playerId: string,
    team: string,
  ) {
    if (draftMode && playerId) {
      const isCrossTeamTransfer = !localRows.some(
        (r) => r.playerId === playerId,
      );

      if (isCrossTeamTransfer) {
        onCrossTeamTransfer?.(playerId, teamId);
      }

      setLocalRows((prev) => {
        const sourceIndex = prev.findIndex((r) => r.playerId === playerId);
        let salary: string;
        if (sourceIndex >= 0) {
          salary = prev[sourceIndex].price;
        } else {
          const existingEntry = allTakenPlayers?.find(
            ([pid]) => pid === playerId,
          );
          salary = existingEntry ? String(existingEntry[3]) : '0';
        }
        return prev.map((row, index) => {
          if (index === rowIndex)
            return {
              ...row,
              search: searchText,
              playerId,
              team,
              price: salary,
              contract: '',
            };
          if (index === sourceIndex)
            return {
              ...row,
              playerId: '',
              search: '',
              team: '',
              price: '0',
              contract: '',
            };
          return row;
        });
      });
      return;
    }
    setLocalRows((prev) =>
      prev.map((row, index) =>
        index !== rowIndex
          ? row
          : {
              ...row,
              search: searchText,
              playerId,
              team,
              contract: playerId !== row.playerId ? '' : row.contract,
            },
      ),
    );
  }

  function handleContractChange(rowIndex: number, value: string) {
    if (value.length > 2) return;
    setLocalRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, contract: value } : row,
      ),
    );
  }

  function handleClearTable() {
    setLocalRows((prev) =>
      prev.map((row) => ({
        ...row,
        playerId: '',
        search: '',
        team: '',
        price: '0',
        contract: '',
      })),
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
        contract: row.contract,
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
        bg={colorIndex !== undefined ? getTeamColor(colorIndex) : 'gray.50'}
        borderBottomWidth={isCollapsed ? undefined : '1px'}
        onClick={() => setIsCollapsed((c) => !c)}
        cursor="pointer"
        userSelect="none"
      >
        {draftMode || readOnly ? (
          <Text fontWeight="bold" fontSize="sm">
            {localTeamName}
          </Text>
        ) : (
          <Input
            value={localTeamName}
            onChange={(e) => setLocalTeamName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            size="sm"
            maxW="180px"
            fontWeight="bold"
            bg="white"
            isDisabled={isSaving}
          />
        )}
        <Text fontWeight="semibold" color="gray.700" fontSize="sm">
          Budget: ${currentBudget}
        </Text>
      </Flex>

      {!isCollapsed && (
        <>
          <TableContainer w="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Pos</Th>
                  <Th>Player</Th>
                  <Th>Team</Th>
                  <Th isNumeric>Price</Th>
                  {!draftMode && <Th>Contract</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row, rowIndex) => (
                  <Tr key={row.rowId}>
                    <Td>{row.position}</Td>
                    <Td>
                      <PlayerSearchInput
                        players={availablePlayers}
                        unavailablePlayerIds={getUnavailablePlayerIds(rowIndex)}
                        position={row.position}
                        leagueType={leagueType}
                        value={row.search}
                        onChange={(searchText, playerId, team) =>
                          handlePlayerSearchChange(
                            rowIndex,
                            searchText,
                            playerId,
                            team,
                          )
                        }
                        isDisabled={
                          isSaving ||
                          isLoadingPlayers ||
                          readOnly ||
                          (draftMode && !!row.playerId)
                        }
                        placeholder={
                          isLoadingPlayers
                            ? 'Loading players...'
                            : 'Search players...'
                        }
                        listId={`player-options-${row.rowId}`}
                      />
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
                        isDisabled={isSaving || readOnly || draftMode}
                      />
                    </Td>
                    {!draftMode && (
                      <Td>
                        <Input
                          size="sm"
                          maxLength={2}
                          value={row.contract}
                          onChange={(e) =>
                            handleContractChange(rowIndex, e.target.value)
                          }
                          width="50px"
                          minWidth="50px"
                          placeholder="--"
                          isDisabled={isSaving || readOnly}
                        />
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {!readOnly && !draftMode && (
            <Flex px={4} py={3} borderTopWidth="1px" bg="gray.50" gap={2}>
              {onSaveChanges ? (
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveChanges();
                  }}
                  isLoading={isSaving}
                  isDisabled={!isDirty}
                >
                  Save Changes
                </Button>
              ) : null}
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearTable();
                }}
                isDisabled={isSaving}
              >
                Clear
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}
