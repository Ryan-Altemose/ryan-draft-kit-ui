'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Text,
  Tr,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { usePlayers } from '@/shared/hooks/usePlayers';
import type { Player } from '@/shared/hooks/usePlayers';

export type { Player as RankingsPlayer };

const DEPTH_CHART_STATUSES = [
  'starter',
  'backup',
  'reserve',
  'minors',
] as const;

const DEPTH_CHART_COLORS: Record<string, string> = {
  starter: 'green',
  backup: 'blue',
  reserve: 'orange',
  minors: 'gray',
};

export default function RankingsTable({
  onPlayerClick,
}: {
  onPlayerClick: (player: Player) => void;
}) {
  const { players: allPlayers, isLoading } = usePlayers();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDepthStatuses, setSelectedDepthStatuses] = useState<string[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const positions = useMemo(
    () => Array.from(new Set(allPlayers.flatMap((p) => p.positions))).sort(),
    [allPlayers],
  );
  const teams = useMemo(
    () => Array.from(new Set(allPlayers.map((p) => p.team))).sort(),
    [allPlayers],
  );
  const leagues = useMemo(
    () =>
      Array.from(
        new Set(
          allPlayers.map((p) => p.league).filter((l): l is string => !!l),
        ),
      ).sort(),
    [allPlayers],
  );
  const statuses = useMemo(
    () =>
      Array.from(
        new Set(
          allPlayers.map((p) => p.injuryStatus).filter((s): s is string => !!s),
        ),
      ).sort(),
    [allPlayers],
  );

  useEffect(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();

    const filtered = allPlayers
      .filter((player) => {
        const matchesPosition =
          selectedPositions.length === 0 ||
          selectedPositions.some((pos) => player.positions.includes(pos));
        const matchesSearch =
          !normalizedSearch ||
          player.name.toLowerCase().includes(normalizedSearch);
        const matchesTeam =
          selectedTeams.length === 0 || selectedTeams.includes(player.team);
        const matchesLeague =
          selectedLeagues.length === 0 ||
          (player.league !== undefined &&
            selectedLeagues.includes(player.league));
        const matchesStatus =
          selectedStatuses.length === 0 ||
          (player.injuryStatus !== undefined &&
            selectedStatuses.includes(player.injuryStatus));
        const matchesDepthStatus =
          selectedDepthStatuses.length === 0 ||
          (player.depthChartStatus !== undefined &&
            selectedDepthStatuses.includes(player.depthChartStatus));

        return (
          matchesPosition &&
          matchesSearch &&
          matchesTeam &&
          matchesLeague &&
          matchesStatus &&
          matchesDepthStatus
        );
      })
      .sort((a, b) => {
        const lastA = a.name.split(' ').pop() ?? '';
        const lastB = b.name.split(' ').pop() ?? '';
        return lastA.localeCompare(lastB);
      });

    setPlayers(filtered.slice(0, 50));
  }, [
    allPlayers,
    appliedSearch,
    selectedLeagues,
    selectedPositions,
    selectedStatuses,
    selectedDepthStatuses,
    selectedTeams,
  ]);

  if (isLoading) {
    return (
      <Box py={10} textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (allPlayers.length === 0) {
    return <Text>failed to retrieve data</Text>;
  }

  function applySearch() {
    setAppliedSearch(searchTerm);
  }

  return (
    <Box>
      <Box mb={4}>
        <Flex gap={3}>
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button size="md" variant="outline">
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverBody>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Team
                </Text>
                <CheckboxGroup
                  value={selectedTeams}
                  onChange={(value) => setSelectedTeams(value as string[])}
                >
                  <Stack maxH="120px" overflowY="auto" spacing={1}>
                    {teams.map((team) => (
                      <Checkbox key={team} value={team}>
                        {team}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>

                <Text fontSize="sm" fontWeight="bold" mb={2} mt={4}>
                  League
                </Text>
                <CheckboxGroup
                  value={selectedLeagues}
                  onChange={(value) => setSelectedLeagues(value as string[])}
                >
                  <Stack spacing={1}>
                    {leagues.map((league) => (
                      <Checkbox key={league} value={league}>
                        {league}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>

                <Text fontSize="sm" fontWeight="bold" mb={2} mt={4}>
                  Injury Status
                </Text>
                <CheckboxGroup
                  value={selectedStatuses}
                  onChange={(value) => setSelectedStatuses(value as string[])}
                >
                  <Stack spacing={1}>
                    {statuses.map((status) => (
                      <Checkbox key={status} value={status}>
                        {status}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>

                <Text fontSize="sm" fontWeight="bold" mb={2} mt={4}>
                  Depth Chart
                </Text>
                <CheckboxGroup
                  value={selectedDepthStatuses}
                  onChange={(value) =>
                    setSelectedDepthStatuses(value as string[])
                  }
                >
                  <Stack spacing={1}>
                    {DEPTH_CHART_STATUSES.map((status) => (
                      <Checkbox key={status} value={status}>
                        {status}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <InputGroup>
            <Input
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applySearch();
                }
              }}
              placeholder="Search player name"
              value={searchTerm}
            />
            <InputRightElement>
              <IconButton
                aria-label="Search players"
                icon={
                  <Icon viewBox="0 0 24 24">
                    <path
                      d="M10.5 3a7.5 7.5 0 1 0 4.73 13.32l4.22 4.21 1.06-1.06-4.21-4.22A7.5 7.5 0 0 0 10.5 3Zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
                      fill="currentColor"
                    />
                  </Icon>
                }
                onClick={applySearch}
                size="sm"
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        </Flex>
      </Box>

      <Wrap mb={4} spacing={2}>
        <WrapItem>
          <Button
            colorScheme={selectedPositions.length === 0 ? 'green' : 'gray'}
            onClick={() => setSelectedPositions([])}
            size="sm"
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
              size="sm"
            >
              {position}
            </Button>
          </WrapItem>
        ))}
      </Wrap>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Name</Th>
              <Th>Team</Th>
              <Th>Pos</Th>
              <Th>Type</Th>
              <Th>League</Th>
              <Th>Status</Th>
              <Th>Depth</Th>
              <Th>Age</Th>
              <Th>Bats/Throws</Th>
            </Tr>
          </Thead>
          <Tbody>
            {players.map((player, index) => (
              <Tr
                key={player._id}
                onClick={() => onPlayerClick(player)}
                cursor="pointer"
                _hover={{ bg: 'green.100' }}
              >
                <Td>{index + 1}</Td>
                <Td>{player.name}</Td>
                <Td>{player.team}</Td>
                <Td>{player.positions.join(', ')}</Td>
                <Td textTransform="capitalize">{player.playerType}</Td>
                <Td>{player.league}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      player.injuryStatus === 'active' ? 'green' : 'red'
                    }
                  >
                    {player.injuryStatus}
                  </Badge>
                </Td>
                <Td>
                  {player.depthChartStatus ? (
                    <Badge
                      colorScheme={
                        DEPTH_CHART_COLORS[player.depthChartStatus] ?? 'gray'
                      }
                    >
                      {player.depthChartStatus}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </Td>
                <Td>{player.age ?? '-'}</Td>
                <Td>{player.batSide || player.pitchHand || '-'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
