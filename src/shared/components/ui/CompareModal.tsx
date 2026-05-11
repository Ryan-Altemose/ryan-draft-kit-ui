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
  Tag,
  Text,
} from '@chakra-ui/react';
import type { LeagueTeam } from '@/features/Leagues/types/leagues.types';

export const BATTING_LOWER_IS_BETTER = new Set(['K']);
export const PITCHING_LOWER_IS_BETTER = new Set([
  'ERA',
  'WHIP',
  'H',
  'BB',
  'HR',
  'L',
]);

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

// Temporary stand-in — replace with real projected totals when available
export function getFakeProjection(
  teamIndex: number,
  statIndex: number,
): number {
  return ((teamIndex * 7 + statIndex * 13) % 20) + 1;
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

type CompareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teams: LeagueTeam[];
  battingCategories: string[];
  pitchingCategories: string[];
};

export default function CompareModal({
  isOpen,
  onClose,
  teams,
  battingCategories,
  pitchingCategories,
}: CompareModalProps) {
  const [leftTeam, setLeftTeam] = useState('');
  const [rightTeam, setRightTeam] = useState('');
  const [category, setCategory] = useState<'Batting' | 'Pitching'>('Batting');

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
        <ModalHeader>Compare</ModalHeader>
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
            {activeCategories.map((stat, statIndex) => {
              const lowerIsBetter = isLowerBetter(stat, category);
              const allValues = teams.map((_, ti) =>
                getFakeProjection(ti, statIndex),
              );

              const leftVal =
                leftTeamIndex >= 0
                  ? getFakeProjection(leftTeamIndex, statIndex)
                  : null;
              const rightVal =
                rightTeamIndex >= 0
                  ? getFakeProjection(rightTeamIndex, statIndex)
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
                    {leftVal !== null ? (
                      <>
                        <Text color={leftColor}>{leftVal}</Text>
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
                    {rightVal !== null ? (
                      <>
                        <Text color={rightColor}>{rightVal}</Text>
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
