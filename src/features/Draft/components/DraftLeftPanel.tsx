'use client';

import { useState } from 'react';
import { Divider, Flex, Select, Spinner } from '@chakra-ui/react';
import { useLeagues } from '@/features/Leagues/hooks/useLeagues';
import type { League } from '@/features/Leagues/types/leagues.types';
import LeagueInfo from './LeagueInfo';

export default function DraftLeftPanel() {
  const { data, isLoading } = useLeagues();
  const leagues = data?.data ?? [];
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  function handleLeagueChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const league = leagues.find((l) => l._id === e.target.value) ?? null;
    setSelectedLeague(league);
  }

  return (
    <Flex direction="column" gap={3} p={4}>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <Select
          placeholder="Select a league"
          size="sm"
          onChange={handleLeagueChange}
        >
          {leagues.map((league) => (
            <option key={league._id} value={league._id}>
              {league.name}
            </option>
          ))}
        </Select>
      )}
      <Divider />
      <LeagueInfo league={selectedLeague} />
    </Flex>
  );
}
