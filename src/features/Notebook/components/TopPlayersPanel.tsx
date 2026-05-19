'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTopPlayers } from '../hooks/useTopPlayers';
import type { Player } from '../types/notebook.types';
import { filterTopPlayers } from '../utils/playerSearch';

type TopPlayersPanelProps = {
  onOpenPlayer: (player: Player) => void;
};

export default function TopPlayersPanel({
  onOpenPlayer,
}: TopPlayersPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { players, isLoadingPlayers, playersError } = useTopPlayers();
  const displayedPlayers = filterTopPlayers(players, searchTerm);

  return (
    <Box>
      <Heading as="h2" size="md" mb={4}>
        Top Players
      </Heading>

      <Input
        mb={4}
        placeholder="Search top players"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        aria-label="Search top players"
      />

      {isLoadingPlayers ? (
        <Flex justify="center" py={4}>
          <Spinner size="sm" />
        </Flex>
      ) : null}

      {playersError ? (
        <Text color="red.500" fontSize="sm">
          {playersError}
        </Text>
      ) : null}

      {!isLoadingPlayers && !playersError ? (
        <VStack align="stretch" spacing={3}>
          {displayedPlayers.map((player, index) => (
            <Box
              key={player._id}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg="white"
              px={4}
              py={3}
              boxShadow="sm"
              cursor="pointer"
              _hover={{ borderColor: 'green.400', boxShadow: 'md' }}
              transition="all 0.15s ease"
              onClick={() => onOpenPlayer(player)}
            >
              <Flex align="center" justify="space-between" gap={3}>
                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                  #{index + 1}
                </Text>
                <Badge
                  colorScheme={
                    player.injuryStatus === 'active' ? 'green' : 'red'
                  }
                  textTransform="uppercase"
                >
                  {player.injuryStatus}
                </Badge>
              </Flex>

              <Text mt={2} fontWeight="semibold" color="gray.800">
                {player.name}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {player.team}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {player.positions.join(', ') || 'No position'}
              </Text>
            </Box>
          ))}
          {displayedPlayers.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No players found.
            </Text>
          ) : null}
        </VStack>
      ) : null}
    </Box>
  );
}
