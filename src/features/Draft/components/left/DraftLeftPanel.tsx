'use client';

import { useEffect, useRef, useState } from 'react';
import { Divider, Flex, Select, Spinner } from '@chakra-ui/react';
import { useLeagues } from '@/features/Leagues/hooks/useLeagues';
import { useLeague } from '@/features/Leagues/hooks/useLeague';
import type { League } from '@/features/Leagues/types/leagues.types';
import LeagueInfo from './LeagueInfo';

type Props = {
  onLeagueChange: (league: League | null) => void;
};

export default function DraftLeftPanel({ onLeagueChange }: Props) {
  const { data, isLoading } = useLeagues();
  const leagues = data?.data ?? [];
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const { data: leagueData } = useLeague(selectedLeagueId || undefined);
  const lastEmittedLeagueId = useRef<string | null>(null);

  useEffect(() => {
    const league = leagueData?.data;
    if (!league) return;

    // Only propagate on initial selection / league switch, not on background refetches.
    // This prevents refetches from overwriting optimistic draft pick state in DraftPage.
    if (league._id === lastEmittedLeagueId.current) return;
    lastEmittedLeagueId.current = league._id;
    onLeagueChange(league);
  }, [leagueData?.data, onLeagueChange]);

  function handleLeagueChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedLeagueId(id);
    lastEmittedLeagueId.current = null;
    if (!id) onLeagueChange(null);
  }

  return (
    <Flex direction="column" gap={3} p={4}>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <Select
          placeholder="Select a league"
          size="sm"
          value={selectedLeagueId}
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
      <LeagueInfo league={leagueData?.data ?? null} />
    </Flex>
  );
}
