'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import type {
  DraftPick,
  LeagueTeam,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { usePlayers } from '@/shared/hooks/usePlayers';
import PlayerSearchInput from '@/shared/components/ui/PlayerSearchInput';

type DraftBoardProps = {
  teams?: LeagueTeam[];
  takenPlayers?: TakenPlayer[];
  draftPicks?: DraftPick[];
  startingBudget?: number;
  onPickEntered?: (pick: DraftPick, takenEntry: TakenPlayer) => void;
  onUndo?: () => void;
};

const COLUMNS = [
  'Pick #',
  'Nominating Team',
  'Player',
  'Winning Team',
  'Salary',
];

export default function DraftBoard({
  teams = [],
  takenPlayers = [],
  draftPicks = [],
  startingBudget = 0,
  onPickEntered,
  onUndo,
}: DraftBoardProps) {
  const { players, isLoading } = usePlayers();
  const toast = useToast();

  const [nominatingTeamId, setNominatingTeamId] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [winningTeamId, setWinningTeamId] = useState('');
  const [salary, setSalary] = useState('');

  const takenPlayerIds = useMemo(
    () => new Set(takenPlayers.map(([id]) => id)),
    [takenPlayers],
  );

  function getRemainingBudget(teamId: string): number {
    const spent = takenPlayers
      .filter(([, tid]) => tid === teamId)
      .reduce((sum, [, , , price]) => sum + price, 0);
    return Math.max(0, startingBudget - spent);
  }

  function handleEnterPick() {
    if (!nominatingTeamId || !playerId || !winningTeamId || !salary) {
      toast({
        title: 'All fields are required.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    const salaryNum = Number.parseInt(salary, 10);
    if (Number.isNaN(salaryNum) || salaryNum <= 0) {
      toast({
        title: 'Salary must be a positive number.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    const remaining = getRemainingBudget(winningTeamId);
    if (salaryNum > remaining) {
      toast({
        title: 'Team cannot afford this pick.',
        description: `Remaining budget: $${remaining}`,
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    const pickNumber = draftPicks.length + 1;
    const newPick: DraftPick = [
      pickNumber,
      nominatingTeamId,
      winningTeamId,
      playerId,
      salaryNum,
    ];
    const newTakenEntry: TakenPlayer = [
      playerId,
      winningTeamId,
      'DRAFT',
      salaryNum,
    ];

    onPickEntered?.(newPick, newTakenEntry);

    setNominatingTeamId('');
    setPlayerSearch('');
    setPlayerId('');
    setWinningTeamId('');
    setSalary('');
  }

  return (
    <Box h="100%" overflowY="auto">
      <Table size="sm">
        <Thead>
          <Tr>
            {COLUMNS.map((col) => (
              <Th
                key={col}
                position="sticky"
                top={0}
                bg="white"
                zIndex={1}
                borderBottomWidth="2px"
                whiteSpace="nowrap"
              >
                {col}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td />
            <Td>
              <Select
                size="sm"
                placeholder="Select team"
                value={nominatingTeamId}
                onChange={(e) => setNominatingTeamId(e.target.value)}
              >
                {teams.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </Td>
            <Td>
              <PlayerSearchInput
                players={players}
                unavailablePlayerIds={takenPlayerIds}
                value={playerSearch}
                onChange={(searchText, pid) => {
                  setPlayerSearch(searchText);
                  setPlayerId(pid);
                }}
                isDisabled={isLoading}
                placeholder={
                  isLoading ? 'Loading players...' : 'Search player...'
                }
                listId="draft-board-player"
              />
            </Td>
            <Td>
              <Select
                size="sm"
                placeholder="Select team"
                value={winningTeamId}
                onChange={(e) => setWinningTeamId(e.target.value)}
              >
                {teams.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </Td>
            <Td>
              <Input
                size="sm"
                type="number"
                min={0}
                placeholder="$"
                width="60px"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </Td>
          </Tr>
        </Tbody>
        <Tfoot>
          <Tr>
            <Td
              colSpan={COLUMNS.length}
              position="sticky"
              bottom={0}
              bg="white"
              borderTopWidth="2px"
              py={2}
            >
              <Flex gap={2}>
                <Button size="sm" colorScheme="blue" onClick={handleEnterPick}>
                  Enter Pick
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={draftPicks.length === 0}
                  onClick={onUndo}
                >
                  Undo
                </Button>
              </Flex>
            </Td>
          </Tr>
        </Tfoot>
      </Table>
    </Box>
  );
}
