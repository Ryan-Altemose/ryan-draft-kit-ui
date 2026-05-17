'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { usePlayers } from '@/shared/hooks/usePlayers';
import type { Player } from '@/shared/hooks/usePlayers';

const DEPTH_COLORS: Record<string, string> = {
  starter: 'green',
  backup: 'blue',
  reserve: 'orange',
  minors: 'gray',
};

const HITTER_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH'];
const PITCHER_POSITIONS = ['SP', 'RP'];

type HitterSortField = 'name' | 'age' | 'ba' | 'hr' | 'rbi' | 'walk' | 'sb';
type PitcherSortField =
  | 'name'
  | 'age'
  | 'era'
  | 'wins'
  | 'losses'
  | 'saves'
  | 'strikeouts'
  | 'innings';
type SortDir = 'asc' | 'desc';

function SortableTh({
  label,
  field,
  currentField,
  currentDir,
  onSort,
}: {
  label: string;
  field: string;
  currentField: string;
  currentDir: SortDir;
  onSort: (field: string) => void;
}) {
  const isActive = currentField === field;
  return (
    <Th
      cursor="pointer"
      onClick={() => onSort(field)}
      color={isActive ? 'green.600' : undefined}
      userSelect="none"
      _hover={{ color: 'green.600' }}
      whiteSpace="nowrap"
    >
      {label}
      {isActive ? (currentDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </Th>
  );
}

function getHitterStat(
  player: Player,
  field: HitterSortField,
  season: string,
): number | undefined {
  const stat = player.stats?.find(
    (s) => s.season === season && s.type === 'hitter',
  );
  if (!stat || stat.type !== 'hitter') return undefined;
  return stat.data[field as keyof typeof stat.data] as number | undefined;
}

function getPitcherStat(
  player: Player,
  field: PitcherSortField,
  season: string,
): number | undefined {
  const stat = player.stats?.find(
    (s) => s.season === season && s.type === 'pitcher',
  );
  if (!stat || stat.type !== 'pitcher') return undefined;
  return stat.data[field as keyof typeof stat.data] as number | undefined;
}

const SearchIcon = (
  <Icon viewBox="0 0 24 24">
    <path
      d="M10.5 3a7.5 7.5 0 1 0 4.73 13.32l4.22 4.21 1.06-1.06-4.21-4.22A7.5 7.5 0 0 0 10.5 3Zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
      fill="currentColor"
    />
  </Icon>
);

export default function StatsPage() {
  const { players: allPlayers, isLoading } = usePlayers();

  const availableSeasons = useMemo(() => {
    const seasons = new Set<string>();
    allPlayers.forEach((p) => p.stats?.forEach((s) => seasons.add(s.season)));
    return Array.from(seasons).sort().reverse();
  }, [allPlayers]);

  const [selectedSeason, setSelectedSeason] = useState('');
  const season = selectedSeason || availableSeasons[0] || '';

  const [hitterSearch, setHitterSearch] = useState('');
  const [hitterAppliedSearch, setHitterAppliedSearch] = useState('');
  const [hitterPositions, setHitterPositions] = useState<string[]>([]);
  const [hitterSortField, setHitterSortField] =
    useState<HitterSortField>('hr');
  const [hitterSortDir, setHitterSortDir] = useState<SortDir>('desc');

  const [pitcherSearch, setPitcherSearch] = useState('');
  const [pitcherAppliedSearch, setPitcherAppliedSearch] = useState('');
  const [pitcherPositions, setPitcherPositions] = useState<string[]>([]);
  const [pitcherSortField, setPitcherSortField] =
    useState<PitcherSortField>('era');
  const [pitcherSortDir, setPitcherSortDir] = useState<SortDir>('asc');

  const hitters = useMemo(() => {
    const normalized = hitterAppliedSearch.trim().toLowerCase();
    return allPlayers
      .filter((p) => {
        if (p.playerType !== 'hitter') return false;
        if (normalized && !p.name.toLowerCase().includes(normalized))
          return false;
        if (
          hitterPositions.length > 0 &&
          !hitterPositions.some((pos) => p.positions.includes(pos))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (hitterSortField === 'name') {
          return hitterSortDir === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (hitterSortField === 'age') {
          const fill =
            hitterSortDir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
          return hitterSortDir === 'asc'
            ? (a.age ?? fill) - (b.age ?? fill)
            : (b.age ?? fill) - (a.age ?? fill);
        }
        const fill =
          hitterSortDir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        const aVal = getHitterStat(a, hitterSortField, season) ?? fill;
        const bVal = getHitterStat(b, hitterSortField, season) ?? fill;
        return hitterSortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
  }, [allPlayers, hitterAppliedSearch, hitterPositions, hitterSortField, hitterSortDir, season]);

  const pitchers = useMemo(() => {
    const normalized = pitcherAppliedSearch.trim().toLowerCase();
    return allPlayers
      .filter((p) => {
        if (p.playerType !== 'pitcher') return false;
        if (normalized && !p.name.toLowerCase().includes(normalized))
          return false;
        if (
          pitcherPositions.length > 0 &&
          !pitcherPositions.some((pos) => p.positions.includes(pos))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (pitcherSortField === 'name') {
          return pitcherSortDir === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (pitcherSortField === 'age') {
          const fill =
            pitcherSortDir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
          return pitcherSortDir === 'asc'
            ? (a.age ?? fill) - (b.age ?? fill)
            : (b.age ?? fill) - (a.age ?? fill);
        }
        const fill =
          pitcherSortDir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        const aVal = getPitcherStat(a, pitcherSortField, season) ?? fill;
        const bVal = getPitcherStat(b, pitcherSortField, season) ?? fill;
        return pitcherSortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
  }, [allPlayers, pitcherAppliedSearch, pitcherPositions, pitcherSortField, pitcherSortDir, season]);

  function toggleHitterSort(field: string) {
    const f = field as HitterSortField;
    if (hitterSortField === f) {
      setHitterSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setHitterSortField(f);
      setHitterSortDir('desc');
    }
  }

  function togglePitcherSort(field: string) {
    const f = field as PitcherSortField;
    if (pitcherSortField === f) {
      setPitcherSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setPitcherSortField(f);
      setPitcherSortDir(f === 'era' ? 'asc' : 'desc');
    }
  }

  if (isLoading) {
    return (
      <Box py={20} textAlign="center">
        <Spinner size="xl" color="green.500" />
        <Text mt={4} color="gray.500">
          Loading player stats...
        </Text>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={4}>
        <Heading>Player Stats</Heading>
        {availableSeasons.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              Season:
            </Text>
            <Flex gap={2}>
              {availableSeasons.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  colorScheme={season === s ? 'green' : 'gray'}
                  onClick={() => setSelectedSeason(s)}
                >
                  {s}
                </Button>
              ))}
            </Flex>
          </Flex>
        )}
      </Flex>

      <Tabs colorScheme="green" variant="enclosed">
        <TabList>
          <Tab>Hitters ({hitters.length})</Tab>
          <Tab>Pitchers ({pitchers.length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0} pt={4}>
            <Flex gap={3} mb={4}>
              <InputGroup maxW="300px">
                <Input
                  placeholder="Search player name"
                  value={hitterSearch}
                  onChange={(e) => setHitterSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setHitterAppliedSearch(hitterSearch);
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Search hitters"
                    size="sm"
                    variant="ghost"
                    icon={SearchIcon}
                    onClick={() => setHitterAppliedSearch(hitterSearch)}
                  />
                </InputRightElement>
              </InputGroup>
            </Flex>

            <Wrap mb={4} spacing={2}>
              <WrapItem>
                <Button
                  size="sm"
                  colorScheme={hitterPositions.length === 0 ? 'green' : 'gray'}
                  onClick={() => setHitterPositions([])}
                >
                  All
                </Button>
              </WrapItem>
              {HITTER_POSITIONS.map((pos) => (
                <WrapItem key={pos}>
                  <Button
                    size="sm"
                    colorScheme={
                      hitterPositions.includes(pos) ? 'green' : 'gray'
                    }
                    onClick={() =>
                      setHitterPositions((prev) =>
                        prev.includes(pos)
                          ? prev.filter((p) => p !== pos)
                          : [...prev, pos],
                      )
                    }
                  >
                    {pos}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>

            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <SortableTh
                      label="Name"
                      field="name"
                      currentField={hitterSortField}
                      currentDir={hitterSortDir}
                      onSort={toggleHitterSort}
                    />
                    <Th>Team</Th>
                    <Th>Pos</Th>
                    <SortableTh
                      label="Age"
                      field="age"
                      currentField={hitterSortField}
                      currentDir={hitterSortDir}
                      onSort={toggleHitterSort}
                    />
                    <Th>Injury</Th>
                    <Th>Depth</Th>
                    <SortableTh
                      label="BA"
                      field="ba"
                      currentField={hitterSortField}
                      currentDir={hitterSortDir}
                      onSort={toggleHitterSort}
                    />
                    <SortableTh
                      label="HR"
                      field="hr"
                      currentField={hitterSortField}
                      currentDir={hitterSortDir}
                      onSort={toggleHitterSort}
                    />
                    <SortableTh
                      label="RBI"
                      field="rbi"
                      currentField={hitterSortField}
                      currentDir={hitterSortDir}
                      onSort={toggleHitterSort}
                    />
                    <SortableTh
                      label="BB"
                      field="walk"
                      currentField={hitterSortField}
                      currentDir={hitterSortDir}
                      onSort={toggleHitterSort}
                    />
                    <SortableTh
                      label="SB"
                      field="sb"
                      currentField={hitterSortField}
                      currentDir={hitterSortDir}
                      onSort={toggleHitterSort}
                    />
                  </Tr>
                </Thead>
                <Tbody>
                  {hitters.map((player) => {
                    const stat = player.stats?.find(
                      (s) => s.season === season && s.type === 'hitter',
                    );
                    const data =
                      stat?.type === 'hitter' ? stat.data : undefined;
                    return (
                      <Tr key={player._id} _hover={{ bg: 'green.50' }}>
                        <Td fontWeight="medium" whiteSpace="nowrap">
                          {player.injuryNote ? (
                            <Tooltip label={player.injuryNote} placement="right">
                              <Text as="span" cursor="help">
                                {player.name}
                              </Text>
                            </Tooltip>
                          ) : (
                            player.name
                          )}
                        </Td>
                        <Td>{player.team}</Td>
                        <Td whiteSpace="nowrap">
                          {player.positions.join(', ')}
                        </Td>
                        <Td isNumeric>{player.age ?? '-'}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              player.injuryStatus === 'active' ? 'green' : 'red'
                            }
                            fontSize="xs"
                          >
                            {player.injuryStatus}
                          </Badge>
                        </Td>
                        <Td>
                          {player.depthChartStatus ? (
                            <Badge
                              colorScheme={
                                DEPTH_COLORS[player.depthChartStatus] ?? 'gray'
                              }
                              fontSize="xs"
                            >
                              {player.depthChartStatus}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </Td>
                        <Td isNumeric>{data?.ba?.toFixed(3) ?? '-'}</Td>
                        <Td isNumeric>{data?.hr ?? '-'}</Td>
                        <Td isNumeric>{data?.rbi ?? '-'}</Td>
                        <Td isNumeric>{data?.walk ?? '-'}</Td>
                        <Td isNumeric>{data?.sb ?? '-'}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            {hitters.length === 0 && (
              <Box py={10} textAlign="center">
                <Text color="gray.500">No hitters match your filters.</Text>
              </Box>
            )}
          </TabPanel>

          <TabPanel px={0} pt={4}>
            <Flex gap={3} mb={4}>
              <InputGroup maxW="300px">
                <Input
                  placeholder="Search player name"
                  value={pitcherSearch}
                  onChange={(e) => setPitcherSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')
                      setPitcherAppliedSearch(pitcherSearch);
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Search pitchers"
                    size="sm"
                    variant="ghost"
                    icon={SearchIcon}
                    onClick={() => setPitcherAppliedSearch(pitcherSearch)}
                  />
                </InputRightElement>
              </InputGroup>
            </Flex>

            <Wrap mb={4} spacing={2}>
              <WrapItem>
                <Button
                  size="sm"
                  colorScheme={
                    pitcherPositions.length === 0 ? 'green' : 'gray'
                  }
                  onClick={() => setPitcherPositions([])}
                >
                  All
                </Button>
              </WrapItem>
              {PITCHER_POSITIONS.map((pos) => (
                <WrapItem key={pos}>
                  <Button
                    size="sm"
                    colorScheme={
                      pitcherPositions.includes(pos) ? 'green' : 'gray'
                    }
                    onClick={() =>
                      setPitcherPositions((prev) =>
                        prev.includes(pos)
                          ? prev.filter((p) => p !== pos)
                          : [...prev, pos],
                      )
                    }
                  >
                    {pos}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>

            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <SortableTh
                      label="Name"
                      field="name"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                    <Th>Team</Th>
                    <Th>Pos</Th>
                    <SortableTh
                      label="Age"
                      field="age"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                    <Th>Injury</Th>
                    <Th>Depth</Th>
                    <SortableTh
                      label="ERA"
                      field="era"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                    <SortableTh
                      label="W"
                      field="wins"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                    <SortableTh
                      label="L"
                      field="losses"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                    <SortableTh
                      label="SV"
                      field="saves"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                    <SortableTh
                      label="K"
                      field="strikeouts"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                    <SortableTh
                      label="IP"
                      field="innings"
                      currentField={pitcherSortField}
                      currentDir={pitcherSortDir}
                      onSort={togglePitcherSort}
                    />
                  </Tr>
                </Thead>
                <Tbody>
                  {pitchers.map((player) => {
                    const stat = player.stats?.find(
                      (s) => s.season === season && s.type === 'pitcher',
                    );
                    const data =
                      stat?.type === 'pitcher' ? stat.data : undefined;
                    return (
                      <Tr key={player._id} _hover={{ bg: 'green.50' }}>
                        <Td fontWeight="medium" whiteSpace="nowrap">
                          {player.injuryNote ? (
                            <Tooltip label={player.injuryNote} placement="right">
                              <Text as="span" cursor="help">
                                {player.name}
                              </Text>
                            </Tooltip>
                          ) : (
                            player.name
                          )}
                        </Td>
                        <Td>{player.team}</Td>
                        <Td whiteSpace="nowrap">
                          {player.positions.join(', ')}
                        </Td>
                        <Td isNumeric>{player.age ?? '-'}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              player.injuryStatus === 'active' ? 'green' : 'red'
                            }
                            fontSize="xs"
                          >
                            {player.injuryStatus}
                          </Badge>
                        </Td>
                        <Td>
                          {player.depthChartStatus ? (
                            <Badge
                              colorScheme={
                                DEPTH_COLORS[player.depthChartStatus] ?? 'gray'
                              }
                              fontSize="xs"
                            >
                              {player.depthChartStatus}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </Td>
                        <Td isNumeric>{data?.era?.toFixed(2) ?? '-'}</Td>
                        <Td isNumeric>{data?.wins ?? '-'}</Td>
                        <Td isNumeric>{data?.losses ?? '-'}</Td>
                        <Td isNumeric>{data?.saves ?? '-'}</Td>
                        <Td isNumeric>{data?.strikeouts ?? '-'}</Td>
                        <Td isNumeric>{data?.innings?.toFixed(1) ?? '-'}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            {pitchers.length === 0 && (
              <Box py={10} textAlign="center">
                <Text color="gray.500">No pitchers match your filters.</Text>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
