import { useQuery } from '@tanstack/react-query';
import { fetchAllLeagueValuationsMap } from '../utils/fetchLeagueValuations';
import { upsertExternalLeague } from '../utils/upsertExternalLeague';
import type { League } from '@/features/Leagues/types/leagues.types';

export function useLeagueValuations(league?: League | null) {
  return useQuery<Record<string, number>>({
    queryKey: ['league-valuations', league?._id],
    queryFn: async () => {
      const external = await upsertExternalLeague(league as League);
      return fetchAllLeagueValuationsMap(external.data._id);
    },
    enabled: Boolean(league?._id),
  });
}
