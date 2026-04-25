'use client';

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
import type { LeagueTeam } from '@/features/Leagues/types/leagues.types';
import { usePlayers } from '@/shared/hooks/usePlayers';
import PlayerSearchInput from '@/shared/components/ui/PlayerSearchInput';

type DraftBoardProps = {
  teams?: LeagueTeam[];
};

const COLUMNS = [
  'Pick #',
  'Nominating Team',
  'Player',
  'Winning Team',
  'Salary',
];

export default function DraftBoard({ teams = [] }: DraftBoardProps) {
  const { players, isLoading } = usePlayers();

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
                unavailablePlayerIds={new Set()}
                value=""
                onChange={() => {}}
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
