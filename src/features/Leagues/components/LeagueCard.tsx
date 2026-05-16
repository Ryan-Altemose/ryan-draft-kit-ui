'use client';

import { Box, Text } from '@chakra-ui/react';
import type { League } from '../types/leagues.types';

interface LeagueCardProps {
  league?: League;
  isNew?: boolean;
  onClick?: () => void;
}

export default function LeagueCard({
  league,
  isNew,
  onClick,
}: LeagueCardProps) {
  if (isNew) {
    return (
      <Box
        as="button"
        w="100%"
        minH="130px"
        borderRadius="lg"
        border="2px solid"
        borderColor="green.500"
        bg="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={1}
        _hover={{ bg: 'green.50', borderColor: 'green.400' }}
        _active={{ bg: 'green.100' }}
        transition="all 0.15s ease"
        cursor="pointer"
        onClick={onClick}
      >
        <Text
          fontSize="3xl"
          lineHeight={1}
          color="green.500"
          fontWeight="light"
        >
          +
        </Text>
        <Text fontSize="sm" fontWeight="semibold" color="green.500">
          New League
        </Text>
      </Box>
    );
  }

  const teamCount = league?.teams?.length ?? 0;

  return (
    <Box
      as="button"
      w="100%"
      textAlign="left"
      borderRadius="lg"
      border="2px solid"
      borderColor="gray.200"
      bg="white"
      boxShadow="sm"
      p={5}
      display="flex"
      flexDirection="column"
      gap={3}
      _hover={{
        borderColor: 'green.400',
        boxShadow: 'md',
        transform: 'translateY(-2px)',
      }}
      _active={{ transform: 'translateY(0)', boxShadow: 'sm' }}
      transition="all 0.15s ease"
      cursor="pointer"
      onClick={onClick}
    >
      <Text fontSize="lg" fontWeight="bold" color="gray.800" noOfLines={1}>
        {league?.name}
      </Text>

      <Text fontSize="sm" color="gray.500">
        {teamCount} {teamCount === 1 ? 'team' : 'teams'}
      </Text>

      {league?.totalBudget !== undefined && (
        <Text fontSize="sm" color="gray.500">
          ${league.totalBudget} budget
        </Text>
      )}
    </Box>
  );
}
