'use client';

import { Box, Button, Flex, Text } from '@chakra-ui/react';
import type { League } from '../types/leagues.types';

interface LeagueCardProps {
  league?: League;
  isNew?: boolean;
  isImport?: boolean;
  onClick?: () => void;
  onExport?: () => void;
  isExportDisabled?: boolean;
}

export default function LeagueCard({
  league,
  isNew,
  isImport,
  onClick,
  onExport,
  isExportDisabled = false,
}: LeagueCardProps) {
  if (isNew || isImport) {
    const color = isImport ? 'blue.500' : 'green.500';
    const hoverColor = isImport ? 'blue.50' : 'green.50';
    const activeColor = isImport ? 'blue.100' : 'green.100';
    const borderColor = isImport ? 'blue.500' : 'green.500';
    const hoverBorderColor = isImport ? 'blue.400' : 'green.400';
    const icon = isImport ? '⇪' : '+';
    const label = isImport ? 'Import League' : 'New League';

    return (
      <Box
        as="button"
        w="100%"
        minH="130px"
        borderRadius="lg"
        border="2px solid"
        borderColor={borderColor}
        bg="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={1}
        _hover={{ bg: hoverColor, borderColor: hoverBorderColor }}
        _active={{ bg: activeColor }}
        transition="all 0.15s ease"
        cursor="pointer"
        onClick={onClick}
      >
        <Text fontSize="3xl" lineHeight={1} color={color} fontWeight="light">
          {icon}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" color={color}>
          {label}
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

      <Flex align="center" justify="space-between" mt="auto" gap={3}>
        {league?.totalBudget !== undefined ? (
          <Text fontSize="sm" color="gray.500">
            ${league.totalBudget} budget
          </Text>
        ) : (
          <Box />
        )}
        {onExport ? (
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            onClick={(event) => {
              event.stopPropagation();
              onExport();
            }}
            isDisabled={isExportDisabled}
          >
            Export JSON
          </Button>
        ) : null}
      </Flex>
    </Box>
  );
}
