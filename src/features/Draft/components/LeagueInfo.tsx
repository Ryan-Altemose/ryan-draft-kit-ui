'use client';

import {
  Box,
  Divider,
  Flex,
  Tag,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import type { League } from '@/features/Leagues/types/leagues.types';

type Props = {
  league: League | null;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="semibold"
      color="gray.500"
      textTransform="uppercase"
      letterSpacing="wide"
    >
      {children}
    </Text>
  );
}

function EmptyState() {
  return (
    <Box p={4} color="gray.400" fontSize="sm">
      Select a league to view details.
    </Box>
  );
}

export default function LeagueInfo({ league }: Props) {
  if (!league) return <EmptyState />;

  return (
    <Flex direction="column" gap={4} p={4}>
      <Box>
        <SectionLabel>League Name</SectionLabel>
        <Text fontWeight="bold" fontSize="md" mt={1}>
          {league.name}
        </Text>
      </Box>

      <Divider />

      <Flex gap={6}>
        <Box>
          <SectionLabel>Teams</SectionLabel>
          <Text fontWeight="semibold" fontSize="md" mt={1}>
            {league.teams?.length ?? '—'}
          </Text>
        </Box>
        <Box>
          <SectionLabel>Starting Budget</SectionLabel>
          <Text fontWeight="semibold" fontSize="md" mt={1}>
            {league.totalBudget != null ? `$${league.totalBudget}` : '—'}
          </Text>
        </Box>
      </Flex>

      <Divider />

      <Box>
        <SectionLabel>Hitting Categories</SectionLabel>
        <Wrap mt={2} spacing={1}>
          {league.battingCategories.map((cat) => (
            <WrapItem key={cat}>
              <Tag size="sm" colorScheme="green" variant="subtle">
                {cat}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </Box>

      <Box>
        <SectionLabel>Pitching Categories</SectionLabel>
        <Wrap mt={2} spacing={1}>
          {league.pitchingCategories.map((cat) => (
            <WrapItem key={cat}>
              <Tag size="sm" colorScheme="blue" variant="subtle">
                {cat}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
    </Flex>
  );
}
