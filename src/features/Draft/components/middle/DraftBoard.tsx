'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import type {
  LeagueTeam,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { usePlayers } from '@/shared/hooks/usePlayers';
import PlayerSearchInput from '@/shared/components/ui/PlayerSearchInput';

type DraftBoardProps = {
  teams?: LeagueTeam[];
  takenPlayers?: TakenPlayer[];
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
}: DraftBoardProps) {
  const { players, isLoading } = usePlayers();
  const [playerSearch, setPlayerSearch] = useState('');

  const takenPlayerIds = useMemo(
    () => new Set(takenPlayers.map(([id]) => id)),
    [takenPlayers],
  );

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
              <Select size="sm" placeholder="Select team">
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
                onChange={(searchText) => setPlayerSearch(searchText)}
                isDisabled={isLoading}
                placeholder={
                  isLoading ? 'Loading players...' : 'Search player...'
                }
                listId="draft-board-player"
              />
            </Td>
            <Td>
              <Select size="sm" placeholder="Select team">
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
              />
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}
