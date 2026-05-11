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

// Stats where a lower value is the better outcome
const BATTING_LOWER_IS_BETTER = new Set(['K']);
const PITCHING_LOWER_IS_BETTER = new Set(['ERA', 'WHIP', 'H', 'BB', 'HR', 'L']);

function getStatColors(
  left: number,
  right: number,
  stat: string,
  category: 'Batting' | 'Pitching',
): { leftColor: string; rightColor: string } {
  const lowerIsBetter =
    category === 'Batting'
      ? BATTING_LOWER_IS_BETTER.has(stat)
      : PITCHING_LOWER_IS_BETTER.has(stat);

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
            {activeCategories.map((stat, i) => {
              const leftVal = i % 3 === 0 ? 10 : i % 3 === 1 ? 5 : 5;
              const rightVal = i % 3 === 0 ? 5 : i % 3 === 1 ? 10 : 5;
              const { leftColor, rightColor } = getStatColors(
                leftVal,
                rightVal,
                stat,
                category,
              );
              return (
                <Box key={stat} display="contents">
                  <GridItem
                    py={2}
                    px={4}
                    textAlign="right"
                    borderBottom="1px solid"
                    borderColor="chakra-border-color"
                  >
                    <Text color={leftColor}>{leftVal}</Text>
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
                    <Text color={rightColor}>{rightVal}</Text>
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
