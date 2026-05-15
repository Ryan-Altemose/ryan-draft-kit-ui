'use client';

import { useEffect, useState } from 'react';
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
import { externalApiClient } from '@/shared/utils/api-client';

export type RankingsPlayer = {
  _id: string;
  name: string;
  team: string;
  positions: string[];
  playerType: string;
  league: string;
  injuryStatus: string;
  depthChartStatus?: string;
  active: boolean;
  age?: number;
  batSide?: string;
  pitchHand?: string;
};

type Player = RankingsPlayer;

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

type PlayersResponse = {
  data?: Player[];
  pagination?: {
    totalPages?: number;
  };
};

export default function RankingsTable({
  onPlayerClick,
}: {
  onPlayerClick: (player: Player) => void;
}) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDepthStatuses, setSelectedDepthStatuses] = useState<string[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
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
          {
            params: { limit: 100, page: 1 },
          },
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
          ...remainingPages.flatMap((page) => page.data ?? []),
        ];

        if (!active || allData.length === 0) {
          setError('failed to retrieve data');
          return;
        }

        const sorted = allData.slice().sort((a, b) => {
          const lastA = a.name.split(' ').pop() ?? '';
          const lastB = b.name.split(' ').pop() ?? '';
          return lastA.localeCompare(lastB);
        });

        setAllPlayers(sorted);
        setPlayers(sorted.slice(0, 50));
        setPositions(
          Array.from(
            new Set(allData.flatMap((player) => player.positions)),
          ).sort(),
        );
        setTeams(
          Array.from(new Set(allData.map((player) => player.team))).sort(),
        );
        setLeagues(
          Array.from(new Set(allData.map((player) => player.league))).sort(),
        );
        setStatuses(
          Array.from(
            new Set(allData.map((player) => player.injuryStatus)),
          ).sort(),
        );
      } catch {
        if (active) {
          setError('failed to retrieve data');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();

    const filteredPlayers = allPlayers.filter((player) => {
      const matchesPosition =
        !selectedPosition || player.positions.includes(selectedPosition);
      const matchesSearch =
        !normalizedSearch ||
        player.name.toLowerCase().includes(normalizedSearch);
      const matchesTeam =
        selectedTeams.length === 0 || selectedTeams.includes(player.team);
      const matchesLeague =
        selectedLeagues.length === 0 || selectedLeagues.includes(player.league);
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(player.injuryStatus);
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
    });

    setError(null);
    setPlayers(filteredPlayers.slice(0, 50));
  }, [
    allPlayers,
    appliedSearch,
    selectedLeagues,
    selectedPosition,
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

  if (error) {
    return <Text>{error}</Text>;
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
            colorScheme={selectedPosition === null ? 'green' : 'gray'}
            onClick={() => setSelectedPosition(null)}
            size="sm"
          >
            All
          </Button>
        </WrapItem>
        {positions.map((position) => (
          <WrapItem key={position}>
            <Button
              colorScheme={selectedPosition === position ? 'green' : 'gray'}
              onClick={() => setSelectedPosition(position)}
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
