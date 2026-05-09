import { useEffect, useState } from 'react';
import { externalApiClient } from '@/shared/utils/api-client';

export type Player = {
  _id: string;
  name: string;
  positions: string[];
  playerType: 'hitter' | 'pitcher';
  team: string;
  league?: string;
  mlbDebutDate?: string;
};

type PlayersResponse = {
  data?: Player[];
  pagination?: { totalPages?: number };
};

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        setIsLoading(true);
        const firstPage = await externalApiClient.get<PlayersResponse>(
          '/api/players',
          { params: { limit: 100, page: 1 } },
        );
        const firstBatch = firstPage.data ?? [];
        const totalPages = firstPage.pagination?.totalPages ?? 1;
        const pageRequests: Promise<PlayersResponse>[] = [];

        for (let page = 2; page <= totalPages; page += 1) {
          pageRequests.push(
            externalApiClient.get<PlayersResponse>('/api/players', {
              params: { limit: 100, page },
            }),
          );
        }

        const remainingPages = await Promise.all(pageRequests);
        const allPlayers = [
          ...firstBatch,
          ...remainingPages.flatMap((p) => p.data ?? []),
        ];

        if (!active) return;
        setPlayers(allPlayers);
      } catch {
        if (active) setPlayers([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPlayers();
    return () => {
      active = false;
    };
  }, []);

  return { players, isLoading };
}
