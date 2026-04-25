'use client';

import { Box, Flex, Input, Text } from '@chakra-ui/react';
import type {
  DraftPick,
  LeagueTeam,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import DraftBoard from './DraftBoard';

type DraftMiddlePanelProps = {
  teams?: LeagueTeam[];
  takenPlayers?: TakenPlayer[];
  draftPicks?: DraftPick[];
  startingBudget?: number;
  onPickEntered?: (pick: DraftPick, takenEntry: TakenPlayer) => void;
  onUndo?: () => void;
};

export default function DraftMiddlePanel({
  teams,
  takenPlayers,
  draftPicks,
  startingBudget,
  onPickEntered,
  onUndo,
}: DraftMiddlePanelProps) {
  return (
    <Flex direction="column" h="100%">
      <Box
        flex="2"
        borderBottomWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <DraftBoard
          teams={teams}
          takenPlayers={takenPlayers}
          draftPicks={draftPicks}
          startingBudget={startingBudget}
          onPickEntered={onPickEntered}
          onUndo={onUndo}
        />
      </Box>
      <Flex flex="1" direction="column" gap={3} p={4}>
        <Text color="gray.400" fontSize="sm">
          Users will query API using search bar
        </Text>
        <Input placeholder="Search..." size="sm" />
      </Flex>
    </Flex>
  );
}
