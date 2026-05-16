'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { externalApiClient } from '@/shared/utils/api-client';
import { useNotebookManager } from '@/features/Notebook/hooks/useNotebookManager';
import NotebookWorkspace from '@/features/Notebook/components/NotebookWorkspace';
import type { Player as NotebookPlayer } from '@/features/Notebook/types/notebook.types';

const TEAMS = [
  'ARI',
  'ATH',
  'ATL',
  'BAL',
  'BOS',
  'CHC',
  'CIN',
  'CLE',
  'COL',
  'CWS',
  'DET',
  'HOU',
  'KC',
  'LAA',
  'LAD',
  'MIA',
  'MIL',
  'MIN',
  'NYM',
  'NYY',
  'PHI',
  'PIT',
  'SD',
  'SEA',
  'SF',
  'STL',
  'TB',
  'TEX',
  'TOR',
  'WSH',
];

const POSITION_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'SP', 'RP'];

const DEPTH_COLORS: Record<string, string> = {
  starter: 'green',
  backup: 'blue',
  reserve: 'orange',
  minors: 'gray',
};

type Player = {
  _id: string;
  name: string;
  team: string;
  positions: string[];
  playerType?: string;
  league?: string;
  depthChartStatus?: string;
  depthChartOrder?: number;
  injuryStatus: string;
  age?: number;
};

type PlayersResponse = {
  data?: Player[];
  pagination?: { totalPages?: number };
};

function groupByPosition(players: Player[]): Record<string, Player[]> {
  const groups: Record<string, Player[]> = {};

  for (const pos of POSITION_ORDER) {
    groups[pos] = [];
  }

  for (const player of players) {
    const primary = player.positions[0];
    if (primary && groups[primary] !== undefined) {
      groups[primary].push(player);
    }
  }

  // Sort each group: charted players (by depthChartOrder) first, uncharted last
  for (const pos of POSITION_ORDER) {
    groups[pos].sort((a, b) => {
      if (a.depthChartOrder !== undefined && b.depthChartOrder !== undefined) {
        return a.depthChartOrder - b.depthChartOrder;
      }
      if (a.depthChartOrder !== undefined) return -1;
      if (b.depthChartOrder !== undefined) return 1;
      return 0;
    });
  }

  return groups;
}

function PositionGroup({
  position,
  players,
  onPlayerClick,
}: {
  position: string;
  players: Player[];
  onPlayerClick: (player: Player) => void;
}) {
  if (players.length === 0) return null;

  return (
    <Box border="1px" borderColor="gray.200" borderRadius="md" p={4}>
      <Text fontWeight="bold" fontSize="sm" color="gray.500" mb={3}>
        {position}
      </Text>
      <Stack spacing={2}>
        {players.map((player, index) => (
          <Flex
            key={player._id}
            align="center"
            justify="space-between"
            gap={2}
            cursor="pointer"
            borderRadius="sm"
            px={1}
            mx={-1}
            _hover={{ bg: 'teal.50' }}
            onClick={() => onPlayerClick(player)}
          >
            <Flex align="center" gap={2} minW={0}>
              <Text
                fontSize="sm"
                color="gray.400"
                w="20px"
                flexShrink={0}
                textAlign="right"
              >
                {player.depthChartOrder ?? index + 1}
              </Text>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {player.name}
              </Text>
            </Flex>
            <Flex gap={1} flexShrink={0}>
              {player.depthChartStatus && (
                <Badge
                  fontSize="xs"
                  colorScheme={DEPTH_COLORS[player.depthChartStatus] ?? 'gray'}
                >
                  {player.depthChartStatus}
                </Badge>
              )}
              {player.injuryStatus !== 'active' && (
                <Badge fontSize="xs" colorScheme="red">
                  {player.injuryStatus}
                </Badge>
              )}
            </Flex>
          </Flex>
        ))}
      </Stack>
    </Box>
  );
}

export default function DepthChartsPage() {
  const [selectedTeam, setSelectedTeam] = useState('NYY');
  const [groups, setGroups] = useState<Record<string, Player[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    selectedNotebookId,
    selectedNotebookName,
    selectedNotebookContent,
    selectedPlayerName,
    selectedPlayer,
    updateNotebookContent,
    updatePlayerContent,
    openPlayerNotebook,
    closeNotebook,
  } = useNotebookManager();

  function handlePlayerClick(player: Player) {
    const notebookPlayer: NotebookPlayer = {
      _id: player._id,
      name: player.name,
      team: player.team,
      positions: player.positions,
      playerType: player.playerType,
      league: player.league,
      injuryStatus: player.injuryStatus,
      age: player.age,
    };
    openPlayerNotebook(notebookPlayer);
  }

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    async function loadTeam() {
      try {
        const firstPage = await externalApiClient.get<PlayersResponse>(
          '/api/players',
          {
            params: { team: selectedTeam, limit: 100, page: 1 },
          },
        );
        const totalPages = firstPage.pagination?.totalPages ?? 1;
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            externalApiClient.get<PlayersResponse>('/api/players', {
              params: { team: selectedTeam, limit: 100, page: i + 2 },
            }),
          ),
        );

        const allPlayers = [
          ...(firstPage.data ?? []),
          ...rest.flatMap((p) => p.data ?? []),
        ];

        if (active) {
          setGroups(groupByPosition(allPlayers));
        }
      } catch {
        if (active) setError('Failed to load depth charts');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTeam();
    return () => {
      active = false;
    };
  }, [selectedTeam]);

  return (
    <>
      <Box p={8}>
        <Flex align="center" justify="space-between" mb={6}>
          <Heading>Depth Charts</Heading>
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            w="160px"
          >
            {TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </Select>
        </Flex>

        {isLoading ? (
          <Box py={10} textAlign="center">
            <Spinner size="lg" />
          </Box>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {POSITION_ORDER.map((pos) => (
              <PositionGroup
                key={pos}
                position={pos}
                players={groups[pos] ?? []}
                onPlayerClick={handlePlayerClick}
              />
            ))}
          </SimpleGrid>
        )}
      </Box>
      <NotebookWorkspace
        selectedNotebookId={selectedNotebookId}
        selectedNotebookName={selectedNotebookName}
        selectedNotebookContent={selectedNotebookContent}
        onNotebookContentChange={updateNotebookContent}
        onPlayerContentChange={updatePlayerContent}
        selectedPlayerName={selectedPlayerName}
        selectedPlayer={selectedPlayer}
        onCloseNotebook={closeNotebook}
        onOpenPlayerNotebook={openPlayerNotebook}
        showLauncher={false}
      />
    </>
  );
}
