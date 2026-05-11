'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Input,
  Select,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import type {
  DraftPick,
  LeagueTeam,
  RosterSlots,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { usePlayers } from '@/shared/hooks/usePlayers';
import { formatPlayerDisplay } from '@/shared/utils/format';
import PlayerSearchInput from '@/shared/components/ui/PlayerSearchInput';
import { autoAssignSlot } from '../../utils/autoAssign';
import { getTeamColor } from '@/features/Leagues/utils/teamColors';

type DraftBoardProps = {
  teams?: LeagueTeam[];
  takenPlayers?: TakenPlayer[];
  draftPicks?: DraftPick[];
  startingBudget?: number;
  rosterSlots?: RosterSlots;
  minorLeagueSlots?: number;
  leagueType?: 'MLB' | 'AL' | 'NL';
  onPickEntered?: (pick: DraftPick, takenEntry: TakenPlayer) => void;
  onUndo?: () => void;
  onFinishDraft?: (name: string) => void | Promise<void>;
  readOnly?: boolean;
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
  rosterSlots,
  minorLeagueSlots = 0,
  leagueType,
  onPickEntered,
  onUndo,
  onFinishDraft,
  readOnly = false,
}: DraftBoardProps) {
  const { players, isLoading } = usePlayers();
  const toast = useToast();
  const finishDraftDialog = useDisclosure();
  const finishDraftCancelRef = useRef<HTMLButtonElement>(null);
  const [draftName, setDraftName] = useState('');

  const displayedDraftPicks = useMemo(
    () => [...draftPicks].sort((a, b) => a[0] - b[0]),
    [draftPicks],
  );

  const [nominatingTeamId, setNominatingTeamId] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [winningTeamId, setWinningTeamId] = useState('');
  const [salary, setSalary] = useState('');

  const takenPlayerIds = useMemo(
    () => new Set(takenPlayers.map(([id]) => id)),
    [takenPlayers],
  );

  const teamColorMap = useMemo(
    () => new Map(teams.map(([id], index) => [id, index])),
    [teams],
  );

  function getTeamName(teamId: string): string {
    return teams.find(([id]) => id === teamId)?.[1] ?? teamId;
  }

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

    const pickNumber = displayedDraftPicks.length + 1;
    const newPick: DraftPick = [
      pickNumber,
      nominatingTeamId,
      winningTeamId,
      playerId,
      salaryNum,
    ];
    const draftedPlayer = players.find((p) => p._id === playerId);
    const slot =
      draftedPlayer && rosterSlots
        ? autoAssignSlot(
            draftedPlayer,
            winningTeamId,
            takenPlayers,
            rosterSlots,
            minorLeagueSlots,
          )
        : 'UNSLOTTED';

    if (slot === 'UNSLOTTED') {
      toast({
        title: 'Invalid pick.',
        description:
          'No eligible roster slot available for this player on the winning team.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    const newTakenEntry: TakenPlayer = [
      playerId,
      winningTeamId,
      slot,
      salaryNum,
    ];

    onPickEntered?.(newPick, newTakenEntry);

    setNominatingTeamId('');
    setPlayerSearch('');
    setPlayerId('');
    setWinningTeamId('');
    setSalary('');
  }

  function handleFinishDraftConfirm() {
    const trimmed = draftName.trim();
    if (!trimmed) {
      toast({
        title: 'Draft name is required.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    void Promise.resolve(onFinishDraft?.(trimmed)).finally(() => {
      setDraftName('');
      finishDraftDialog.onClose();
    });
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
          {displayedDraftPicks.map(
            ([pickNum, nominatingId, winningId, pid, sal]) => {
              const player = players.find((p) => p._id === pid);
              const colorIndex = teamColorMap.get(winningId);
              return (
                <Tr
                  key={pickNum}
                  bg={
                    colorIndex !== undefined
                      ? getTeamColor(colorIndex)
                      : undefined
                  }
                  sx={{ '& td': { borderBottom: 'none' } }}
                >
                  <Td>{pickNum}</Td>
                  <Td>{getTeamName(nominatingId)}</Td>
                  <Td>
                    {player ? (
                      <Box>
                        <Text fontSize="sm">{formatPlayerDisplay(player)}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {player.positions.join('/')} &middot; {player.team}
                        </Text>
                      </Box>
                    ) : isLoading ? (
                      'Loading players...'
                    ) : (
                      pid
                    )}
                  </Td>
                  <Td>{getTeamName(winningId)}</Td>
                  <Td isNumeric>${sal}</Td>
                </Tr>
              );
            },
          )}
          {!readOnly ? (
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
                  leagueType={leagueType}
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
          ) : null}
        </Tbody>
        {!readOnly ? (
          <Tfoot>
            <Tr>
              <Td colSpan={COLUMNS.length} borderTopWidth="2px" py={2}>
                <Flex align="center" justify="space-between" w="100%" gap={2}>
                  <Flex gap={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={handleEnterPick}
                    >
                      Enter Pick
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      isDisabled={displayedDraftPicks.length === 0}
                      onClick={onUndo}
                    >
                      Undo
                    </Button>
                  </Flex>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={finishDraftDialog.onOpen}
                    isDisabled={displayedDraftPicks.length === 0}
                  >
                    Finish Draft
                  </Button>
                </Flex>
              </Td>
            </Tr>
          </Tfoot>
        ) : null}
      </Table>

      {!readOnly ? (
        <AlertDialog
          isOpen={finishDraftDialog.isOpen}
          leastDestructiveRef={finishDraftCancelRef}
          onClose={finishDraftDialog.onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Finish Draft
              </AlertDialogHeader>

              <AlertDialogBody>
                <Stack spacing={3}>
                  <Text fontSize="sm">
                    This will finish the current draft. This action can’t be
                    undone. To continue drafting later, you’ll need to start a
                    new draft.
                  </Text>
                  <Input
                    placeholder="Draft name (e.g. 2026 Season)"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                </Stack>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button
                  ref={finishDraftCancelRef}
                  onClick={finishDraftDialog.onClose}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleFinishDraftConfirm}
                  ml={3}
                >
                  Confirm
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      ) : null}
    </Box>
  );
}
