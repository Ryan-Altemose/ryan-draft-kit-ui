'use client';

import { Spinner, Text, SimpleGrid, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { ERROR_MESSAGES } from '@/shared/constants';
import { isApiError } from '@/shared/utils/api-client';
import { useLeagues } from '../hooks/useLeagues';
import LeagueCard from './LeagueCard';
import UpsertLeagueModal from './UpsertLeagueModal';

export default function LeagueList() {
  const router = useRouter();
  const { data, isLoading, error } = useLeagues();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const leagues = data?.data ?? [];

  if (isLoading) return <Spinner />;

  if (error) {
    const message = isApiError(error)
      ? error.status === 403
        ? ERROR_MESSAGES.FORBIDDEN
        : error.message
      : 'Error loading leagues';

    return <Text>{message}</Text>;
  }

  return (
    <>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
        <LeagueCard isNew onClick={onOpen} />
        {leagues.map((league) => (
          <LeagueCard
            key={league._id}
            league={league}
            onClick={() => router.push(`/leagues/${league._id}`)}
          />
        ))}
      </SimpleGrid>
      {leagues.length === 0 ? (
        <Text mt={4} color="gray.600">
          No leagues yet. Create a league to get started.
        </Text>
      ) : null}
      <UpsertLeagueModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}
