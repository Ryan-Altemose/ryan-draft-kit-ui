'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import type { LeagueTeam, TakenPlayer } from '../types/leagues.types';
import { usePlayers, type Player } from '@/shared/hooks/usePlayers';
import { formatPlayerDisplay } from '@/shared/utils/format';
import PlayerSearchInput from '@/shared/components/ui/PlayerSearchInput';
import { getTeamColor } from '../utils/teamColors';

type SimpleTeamTableProps = {
  team: LeagueTeam;
  mode: 'minorLeague' | 'taxiSquad';
  slotCount: number;
  startingBudget: number;
  leagueType?: 'MLB' | 'AL' | 'NL';
  takenPlayers?: TakenPlayer[];
  allTakenPlayers?: TakenPlayer[];
  onSaveChanges?: (payload: {
    teamName: string;
    rows: Array<{ rowId: string; playerId: string; price: number }>;
  }) => void;
  isSaving?: boolean;
  readOnly?: boolean;
  colorIndex?: number;
  onPlayerNotebookOpen?: (player: Player) => void;
};

type SimpleTableRow = {
  rowId: string;
  playerId: string;
  search: string;
  team: string;
};

function rowPrefix(mode: 'minorLeague' | 'taxiSquad'): string {
  return mode === 'minorLeague' ? 'MiLB' : 'TAXI';
}

function buildRows(
  mode: 'minorLeague' | 'taxiSquad',
  slotCount: number,
  takenPlayers: TakenPlayer[],
): SimpleTableRow[] {
  const prefix = rowPrefix(mode);
  return Array.from({ length: slotCount }, (_, index) => {
    const rowId = `${prefix}-${index}`;
    const player = takenPlayers.find(([, , slot]) => slot === rowId);
    return {
      rowId,
      playerId: player?.[0] ?? '',
      search: '',
      team: '',
    };
  });
}

export default function SimpleTeamTable({
  team,
  mode,
  slotCount,
  startingBudget,
  leagueType,
  takenPlayers = [],
  allTakenPlayers,
  onSaveChanges,
  isSaving = false,
  readOnly = false,
  colorIndex,
  onPlayerNotebookOpen,
}: SimpleTeamTableProps) {
  const [teamId, teamName] = team;
  const { players, isLoading: isLoadingPlayers } = usePlayers();

  const propRows = useMemo(
    () => buildRows(mode, slotCount, takenPlayers),
    [mode, slotCount, takenPlayers],
  );

  const [localRows, setLocalRows] = useState<SimpleTableRow[]>(propRows);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const takenIds = new Set(
      (allTakenPlayers ?? takenPlayers).map(([id]) => id),
    );
    setLocalRows((currentRows) =>
      propRows.map((propRow, index) => {
        const localRow = currentRows[index];
        // Local pick was claimed by another team — clear it
        if (
          localRow?.playerId &&
          localRow.playerId !== propRow.playerId &&
          takenIds.has(localRow.playerId)
        ) {
          return { ...propRow, search: '', team: '' };
        }
        // Preserve other unsaved local changes
        if (localRow?.playerId && localRow.playerId !== propRow.playerId) {
          return localRow;
        }
        // Sync display info for saved data
        if (!propRow.playerId || players.length === 0) {
          return { ...propRow, search: '', team: '' };
        }
        const match = players.find((p) => p._id === propRow.playerId);
        return match
          ? { ...propRow, search: formatPlayerDisplay(match), team: match.team }
          : { ...propRow, search: '', team: '' };
      }),
    );
  }, [propRows, players, allTakenPlayers, takenPlayers]);

  const leagueTakenPlayerIds = useMemo(
    () =>
      new Set((allTakenPlayers ?? takenPlayers).map(([playerId]) => playerId)),
    [allTakenPlayers, takenPlayers],
  );

  const currentBudget = useMemo(() => {
    const rowSlots = new Set(localRows.map((r) => r.rowId));
    const extraSpend = takenPlayers
      .filter(([, , slot]) => !rowSlots.has(slot))
      .reduce((sum, [, , , price]) => sum + price, 0);
    return Math.max(0, startingBudget - extraSpend);
  }, [localRows, takenPlayers, startingBudget]);

  // Minor league view: only players without an MLB debut date; taxi squad: no restriction
  const eligiblePlayers = useMemo(
    () =>
      mode === 'minorLeague' ? players.filter((p) => !p.mlbDebutDate) : players,
    [mode, players],
  );

  function getUnavailableIds(currentRowIndex: number): Set<string> {
    const ids = new Set(leagueTakenPlayerIds);
    localRows.forEach((row, index) => {
      if (index !== currentRowIndex && row.playerId) ids.add(row.playerId);
    });
    return ids;
  }

  function handlePlayerChange(
    rowIndex: number,
    searchText: string,
    playerId: string,
    playerTeam: string,
  ) {
    setLocalRows((prev) =>
      prev.map((row, index) =>
        index !== rowIndex
          ? row
          : { ...row, search: searchText, playerId, team: playerTeam },
      ),
    );
  }

  function handleClear() {
    setLocalRows((prev) =>
      prev.map((row) => ({ ...row, playerId: '', search: '', team: '' })),
    );
  }

  function handleSave() {
    onSaveChanges?.({
      teamName,
      rows: localRows.map((row) => ({
        rowId: row.rowId,
        playerId: row.playerId,
        price: 0,
      })),
    });
  }

  const isDirty = localRows.some(
    (row, index) => row.playerId !== propRows[index]?.playerId,
  );

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
        <Text fontWeight="bold" fontSize="sm">
          {teamName}
        </Text>
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
                  <Th>Player</Th>
                  <Th>Team</Th>
                </Tr>
              </Thead>
              <Tbody>
                {localRows.map((row, rowIndex) => {
                  const rowPlayer = row.playerId
                    ? players.find((player) => player._id === row.playerId)
                    : undefined;
                  const canOpenNotebook = !!rowPlayer && !!onPlayerNotebookOpen;

                  return (
                    <Tr key={row.rowId}>
                      <Td>
                        <PlayerSearchInput
                          players={eligiblePlayers}
                          unavailablePlayerIds={getUnavailableIds(rowIndex)}
                          leagueType={leagueType}
                          value={row.search}
                          onChange={(searchText, playerId, playerTeam) =>
                            handlePlayerChange(
                              rowIndex,
                              searchText,
                              playerId,
                              playerTeam,
                            )
                          }
                          isDisabled={
                            isSaving ||
                            isLoadingPlayers ||
                            (readOnly && !canOpenNotebook)
                          }
                          isReadOnly={canOpenNotebook && readOnly}
                          onClick={
                            canOpenNotebook
                              ? () => onPlayerNotebookOpen(rowPlayer)
                              : undefined
                          }
                          placeholder={
                            isLoadingPlayers
                              ? 'Loading players...'
                              : 'Search players...'
                          }
                          listId={`player-options-${row.rowId}-${teamId}`}
                        />
                      </Td>
                      <Td>{row.team || '-'}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>

          {!readOnly && (
            <Flex px={4} py={3} borderTopWidth="1px" bg="gray.50" gap={2}>
              {onSaveChanges ? (
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
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
                  handleClear();
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
