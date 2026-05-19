'use client';

import { useState } from 'react';
import {
  Box,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Tag,
  Text,
} from '@chakra-ui/react';
import type {
  League,
  LeagueTeam,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { useLeagueProjections } from '@/features/Valuations/hooks/useLeagueProjections';

export const BATTING_LOWER_IS_BETTER = new Set<string>([]);
export const PITCHING_LOWER_IS_BETTER = new Set(['ERA', 'L']);

const BATTING_STAT_MAP: Record<string, string> = {
  AVG: 'ba',
  HR: 'hr',
  RBI: 'rbi',
  BB: 'walk',
  SB: 'sb',
};

const PITCHING_STAT_MAP: Record<string, string> = {
  ERA: 'era',
  W: 'wins',
  L: 'losses',
  SV: 'saves',
  K: 'strikeouts',
  IP: 'innings',
};

export function isLowerBetter(
  stat: string,
  category: 'Batting' | 'Pitching',
): boolean {
  return category === 'Batting'
    ? BATTING_LOWER_IS_BETTER.has(stat)
    : PITCHING_LOWER_IS_BETTER.has(stat);
}

export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function getRank(
  value: number,
  allValues: number[],
  lowerIsBetter: boolean,
): number {
  return (
    allValues.filter((v) => (lowerIsBetter ? v < value : v > value)).length + 1
  );
}

export function getStatColors(
  left: number,
  right: number,
  stat: string,
  category: 'Batting' | 'Pitching',
): { leftColor: string; rightColor: string } {
  const lowerIsBetter = isLowerBetter(stat, category);
  if (left === right) return { leftColor: 'blue.500', rightColor: 'blue.500' };
  const leftWins = lowerIsBetter ? left < right : left > right;
  return {
    leftColor: leftWins ? 'green.500' : 'red.500',
    rightColor: leftWins ? 'red.500' : 'green.500',
  };
}

function formatCompareValue(stat: string, value: number): string {
  if (stat === 'AVG') return value.toFixed(3);
  if (stat === 'ERA') return value.toFixed(2);
  return parseFloat(value.toFixed(2)).toString();
}

type CompareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  league: League | null;
  teams: LeagueTeam[];
  battingCategories: string[];
  pitchingCategories: string[];
};

export default function CompareModal({
  isOpen,
  onClose,
  league,
  teams,
  battingCategories,
  pitchingCategories,
}: CompareModalProps) {
  const [leftTeam, setLeftTeam] = useState('');
  const [rightTeam, setRightTeam] = useState('');
  const [category, setCategory] = useState<'Batting' | 'Pitching'>('Batting');

  const projectionsQuery = useLeagueProjections(league);
  const averagedStatsByPlayerId =
    projectionsQuery.data?.averagedStatsByPlayerId ?? {};
  const playerTypeByPlayerId =
    projectionsQuery.data?.playerTypeByPlayerId ?? {};

  const takenPlayers: TakenPlayer[] = league?.taken_players ?? [];

  function getTeamPlayerIds(teamId: string): string[] {
    return takenPlayers
      .filter(
        ([, tid, slot]) =>
          tid === teamId &&
          !slot.startsWith('BENCH') &&
          !slot.startsWith('MiLB') &&
          !slot.startsWith('TAXI'),
      )
      .map(([pid]) => pid);
  }

  function computeTeamValue(
    teamId: string,
    statLabel: string,
    activeCategory: 'Batting' | 'Pitching',
  ): number | null {
    const statMap =
      activeCategory === 'Batting' ? BATTING_STAT_MAP : PITCHING_STAT_MAP;
    const statKey = statMap[statLabel];
    if (!statKey) return null;

    const rateStat =
      (activeCategory === 'Batting' && statLabel === 'AVG') ||
      (activeCategory === 'Pitching' && statLabel === 'ERA');

    const playerIds = getTeamPlayerIds(teamId);
    const values: number[] = [];

    for (const playerId of playerIds) {
      const playerType = playerTypeByPlayerId[playerId];
      if (activeCategory === 'Batting' && playerType === 'pitcher') continue;
      if (activeCategory === 'Pitching' && playerType === 'hitter') continue;

      const stats = averagedStatsByPlayerId[playerId];
      const val = stats?.[statKey];
      if (typeof val === 'number' && Number.isFinite(val)) {
        values.push(val);
      }
    }

    if (values.length === 0) return null;
    if (!rateStat) return values.reduce((a, b) => a + b, 0);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  const activeCategories =
    category === 'Batting' ? battingCategories : pitchingCategories;
  const tagColor = category === 'Batting' ? 'green' : 'blue';

  const leftTeamIndex = teams.findIndex(([id]) => id === leftTeam);
  const rightTeamIndex = teams.findIndex(([id]) => id === rightTeam);

  const teamOptions = teams.map(([id, name]) => (
    <option key={id} value={id}>
      {name}
    </option>
  ));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Projected Team Totals
          <Text fontSize="xs" fontWeight="normal" color="gray.500" mt={1}>
            Bench, minor league, and taxi squad players are excluded from these
            totals.
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Grid templateColumns="1fr 1fr 1fr" gap={6} mb={6}>
            <FormControl>
              <FormLabel>Team Select</FormLabel>
              <Select
                placeholder="Select team"
                value={leftTeam}
                onChange={(e) => setLeftTeam(e.target.value)}
              >
                {teamOptions}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as 'Batting' | 'Pitching')
                }
              >
                <option value="Batting">Batting</option>
                <option value="Pitching">Pitching</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Team Select</FormLabel>
              <Select
                placeholder="Select team"
                value={rightTeam}
                onChange={(e) => setRightTeam(e.target.value)}
              >
                {teamOptions}
              </Select>
            </FormControl>
          </Grid>

          <Divider mb={4} />

          <Grid templateColumns="1fr auto 1fr">
            {activeCategories.map((stat) => {
              const lowerIsBetter = isLowerBetter(stat, category);
              const allValues = teams
                .map(([id]) => computeTeamValue(id, stat, category))
                .filter((v): v is number => v !== null);

              const leftTeamId =
                leftTeamIndex >= 0 ? teams[leftTeamIndex]?.[0] : null;
              const rightTeamId =
                rightTeamIndex >= 0 ? teams[rightTeamIndex]?.[0] : null;

              const leftVal = leftTeamId
                ? computeTeamValue(leftTeamId, stat, category)
                : null;
              const rightVal = rightTeamId
                ? computeTeamValue(rightTeamId, stat, category)
                : null;

              const leftRank =
                leftVal !== null
                  ? getRank(leftVal, allValues, lowerIsBetter)
                  : null;
              const rightRank =
                rightVal !== null
                  ? getRank(rightVal, allValues, lowerIsBetter)
                  : null;

              const { leftColor, rightColor } =
                leftVal !== null && rightVal !== null
                  ? getStatColors(leftVal, rightVal, stat, category)
                  : { leftColor: 'inherit', rightColor: 'inherit' };

              return (
                <Box key={stat} display="contents">
                  <GridItem
                    py={2}
                    px={4}
                    textAlign="right"
                    borderBottom="1px solid"
                    borderColor="chakra-border-color"
                  >
                    {projectionsQuery.isLoading ? (
                      <Spinner size="xs" color="gray.400" />
                    ) : leftVal !== null ? (
                      <>
                        <Text color={leftColor}>
                          {formatCompareValue(stat, leftVal)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {getOrdinal(leftRank!)}
                        </Text>
                      </>
                    ) : (
                      <Text color="gray.400">—</Text>
                    )}
                  </GridItem>
                  <GridItem
                    py={2}
                    px={6}
                    textAlign="center"
                    borderBottom="1px solid"
                    borderColor="chakra-border-color"
                  >
                    <Tag size="sm" colorScheme={tagColor} variant="subtle">
                      {stat}
                    </Tag>
                  </GridItem>
                  <GridItem
                    py={2}
                    px={4}
                    textAlign="left"
                    borderBottom="1px solid"
                    borderColor="chakra-border-color"
                  >
                    {projectionsQuery.isLoading ? (
                      <Spinner size="xs" color="gray.400" />
                    ) : rightVal !== null ? (
                      <>
                        <Text color={rightColor}>
                          {formatCompareValue(stat, rightVal)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {getOrdinal(rightRank!)}
                        </Text>
                      </>
                    ) : (
                      <Text color="gray.400">—</Text>
                    )}
                  </GridItem>
                </Box>
              );
            })}
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
