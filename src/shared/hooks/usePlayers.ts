import { useEffect, useState } from 'react';
import { externalApiClient } from '@/shared/utils/api-client';

export type Player = {
  _id: string;
  name: string;
  positions: string[];
  playerType: 'hitter' | 'pitcher';
  team: string;
  league?: string;
  depthChartStatus?: 'starter' | 'backup' | 'reserve' | 'minors';
  injuryStatus?: string;
  active?: boolean;
  age?: number;
  batSide?: string;
  pitchHand?: string;
};

type PlayersResponse = {
  data?: Player[];
  pagination?: { totalPages?: number };
};

// Module-level singleton: all usePlayers() callers share one in-flight request
// and get the same cached result, preventing duplicate API hits on pages with
// multiple components that each need the full player list.
let _cache: Player[] = [];
let _promise: Promise<Player[]> | null = null;

async function fetchAllPlayers(): Promise<Player[]> {
  if (_cache.length > 0) return _cache;
  if (_promise) return _promise;

  _promise = (async () => {
    const firstPage = await externalApiClient.get<PlayersResponse>(
      '/api/players',
      { params: { limit: 100, page: 1 } },
    );
    const firstBatch = firstPage.data ?? [];
    const totalPages = firstPage.pagination?.totalPages ?? 1;

    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        externalApiClient.get<PlayersResponse>('/api/players', {
          params: { limit: 100, page: i + 2 },
        }),
      ),
    );

    _cache = [...firstBatch, ...remaining.flatMap((p) => p.data ?? [])];
    return _cache;
  })();

  _promise.catch(() => {
    _promise = null; // allow retry on next mount after a failure
  });

  return _promise;
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(_cache);
  const [isLoading, setIsLoading] = useState(_cache.length === 0);

  useEffect(() => {
    if (_cache.length > 0) return;

    let active = true;
    fetchAllPlayers()
      .then((data) => {
        if (active) setPlayers(data);
      })
      .catch(() => {
        if (active) setPlayers([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { players, isLoading };
}
