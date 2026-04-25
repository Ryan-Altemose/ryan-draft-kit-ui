'use client';

import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { League } from '@/features/Leagues/types/leagues.types';
import DraftLeftPanel from './components/left/DraftLeftPanel';
import DraftMiddlePanel from './components/middle/DraftMiddlePanel';
import DraftRightPanel from './components/right/DraftRightPanel';

export default function DraftPage() {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  return (
    <Flex h="100vh" overflow="hidden">
      <Box
        flexBasis="16.67%"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="gray.200"
        overflowY="auto"
      >
        <DraftLeftPanel onLeagueChange={setSelectedLeague} />
      </Box>
      <Box
        flexBasis="50%"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <DraftMiddlePanel teams={selectedLeague?.teams ?? []} />
      </Box>
      <Box flex={1} minH={0} overflowY="auto">
        <DraftRightPanel league={selectedLeague} />
      </Box>
    </Flex>
  );
}
