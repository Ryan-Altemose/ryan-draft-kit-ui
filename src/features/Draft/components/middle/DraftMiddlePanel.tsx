'use client';

import { Box, Flex, Input, Text } from '@chakra-ui/react';
import type { LeagueTeam } from '@/features/Leagues/types/leagues.types';
import DraftBoard from './DraftBoard';

type DraftMiddlePanelProps = {
  teams?: LeagueTeam[];
};

export default function DraftMiddlePanel({ teams }: DraftMiddlePanelProps) {
  return (
    <Flex direction="column" h="100%">
      <Box
        flex="2"
        borderBottomWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <DraftBoard teams={teams} />
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
