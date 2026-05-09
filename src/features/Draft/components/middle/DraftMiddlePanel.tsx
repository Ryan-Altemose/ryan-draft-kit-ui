'use client';

import { Box, Flex, Input, Text } from '@chakra-ui/react';
import type {
  DraftPick,
  LeagueTeam,
  RosterSlots,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import DraftBoard from './DraftBoard';

type DraftMiddlePanelProps = {
  teams?: LeagueTeam[];
  takenPlayers?: TakenPlayer[];
  draftPicks?: DraftPick[];
  startingBudget?: number;
  rosterSlots?: RosterSlots;
  minorLeagueSlots?: number;
  leagueType?: 'MLB' | 'AL' | 'NL';
  onPickEntered?: (pick: DraftPick, takenEntry: TakenPlayer) => void;
  onUndo?: () => void;
  onFinishDraft?: (name: string) => void | Promise<void>;
  readOnly?: boolean;
};

export default function DraftMiddlePanel({
  teams,
  takenPlayers,
  draftPicks,
  startingBudget,
  rosterSlots,
  minorLeagueSlots,
  leagueType,
  onPickEntered,
  onUndo,
  onFinishDraft,
  readOnly = false,
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
          rosterSlots={rosterSlots}
          minorLeagueSlots={minorLeagueSlots}
          leagueType={leagueType}
          onPickEntered={onPickEntered}
          onUndo={onUndo}
          onFinishDraft={onFinishDraft}
          readOnly={readOnly}
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
