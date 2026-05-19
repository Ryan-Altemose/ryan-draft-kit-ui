import { externalApiClient } from '@/shared/utils/api-client';
import type { League } from '@/features/Leagues/types/leagues.types';
import type { LeagueValuationsResponse } from '../types/valuations.types';
import { serializeLeagueForValuations } from './serializeLeagueForValuations';

const PAGE_LIMIT = 100;

export async function fetchLeagueValuationsPage(
  league: League,
  page: number,
  limit: number = PAGE_LIMIT,
): Promise<LeagueValuationsResponse> {
  return externalApiClient.post<LeagueValuationsResponse>('/api/valuations', {
    league: serializeLeagueForValuations(league),
    query: { page, limit },
  });
}

export async function fetchAllLeagueValuations(
  league: League,
): Promise<LeagueValuationsResponse> {
  const first = await fetchLeagueValuationsPage(league, 1, PAGE_LIMIT);
  const total =
    first.data?.pagination?.total ?? first.data?.valuations?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  if (totalPages === 1) return first;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchLeagueValuationsPage(league, index + 2, PAGE_LIMIT),
    ),
  );

  return {
    ...first,
    data: {
      ...first.data,
      valuations: [
        ...(first.data?.valuations ?? []),
        ...remaining.flatMap((r) => r.data?.valuations ?? []),
      ],
      pagination: {
        ...first.data.pagination,
        total,
      },
    },
  };
}

export async function fetchAllLeagueValuationsMap(
  league: League,
): Promise<Record<string, number>> {
  const response = await fetchAllLeagueValuations(league);
  const map: Record<string, number> = {};
  for (const valuation of response.data?.valuations ?? []) {
    map[valuation.playerId] = valuation.dollarValue;
  }
  return map;
}
