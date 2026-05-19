'use client';

import {
  Spinner,
  Text,
  SimpleGrid,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { ERROR_MESSAGES } from '@/shared/constants';
import { isApiError } from '@/shared/utils/api-client';
import { usePlayers } from '@/shared/hooks/usePlayers';
import { useLeagues } from '../hooks/useLeagues';
import { downloadLeagueJson } from '../utils/exportLeague';
import LeagueCard from './LeagueCard';
import ImportLeagueModal from './ImportLeagueModal';
import UpsertLeagueModal from './UpsertLeagueModal';

export default function LeagueList() {
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading, error } = useLeagues();
  const { players, isLoading: isLoadingPlayers } = usePlayers();
  const createModal = useDisclosure();
  const importModal = useDisclosure();
  const leagues = data?.data ?? [];

  function handleExport(league: (typeof leagues)[number]) {
    try {
      downloadLeagueJson(league, players);
    } catch (exportError) {
      toast({
        title: 'Unable to export league',
        description:
          exportError instanceof Error ? exportError.message : 'Export failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }

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
        <LeagueCard isNew onClick={createModal.onOpen} />
        <LeagueCard isImport onClick={importModal.onOpen} />
        {leagues.map((league) => (
          <LeagueCard
            key={league._id}
            league={league}
            onClick={() => router.push(`/leagues/${league._id}`)}
            onExport={() => handleExport(league)}
            isExportDisabled={isLoadingPlayers}
          />
        ))}
      </SimpleGrid>
      {leagues.length === 0 ? (
        <Text mt={4} color="gray.600">
          No leagues yet. Create a league to get started.
        </Text>
      ) : null}
      <UpsertLeagueModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
      />
      <ImportLeagueModal
        isOpen={importModal.isOpen}
        onClose={importModal.onClose}
      />
    </>
  );
}
