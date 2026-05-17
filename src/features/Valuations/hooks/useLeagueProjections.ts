import { useQuery } from '@tanstack/react-query';
import type { League } from '@/features/Leagues/types/leagues.types';
import { upsertExternalLeague } from '../utils/upsertExternalLeague';
import { fetchAllLeagueValuations } from '../utils/fetchLeagueValuations';

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`)
    .join(',')}}`;
}

function leagueProjectionsFingerprint(league: League): string {
  // Include only fields that impact the valuations' averagedStats output.
  return stableStringify({
    format: league.format,
    draftType: league.draftType,
    leagueType: league.leagueType,
    battingCategories: league.battingCategories,
    pitchingCategories: league.pitchingCategories,
    rosterSlots: league.rosterSlots,
    totalBudget: league.totalBudget,
    categoryWeights: league.categoryWeights,
    teams: league.teams,
    taken_players: league.taken_players,
    draft_picks: league.draft_picks,
    minorLeagueSlotsPerTeam: league.minorLeagueSlotsPerTeam,
    taxiSquadPlayersPerTeam: league.taxiSquadPlayersPerTeam,
  });
}

export type LeagueProjections = {
  averagedStatsByPlayerId: Record<string, Record<string, number>>;
  playerTypeByPlayerId: Record<string, 'hitter' | 'pitcher'>;
};

export function useLeagueProjections(league?: League | null) {
  return useQuery<LeagueProjections>({
    queryKey: league?._id
      ? ['league-projections', league._id, leagueProjectionsFingerprint(league)]
      : ['league-projections', undefined],
    enabled: Boolean(league?._id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const external = await upsertExternalLeague(league as League);
      const valuationsResponse = await fetchAllLeagueValuations(
        external.data._id,
      );

      const averagedStatsByPlayerId: Record<
        string,
        Record<string, number>
      > = {};
      const playerTypeByPlayerId: Record<string, 'hitter' | 'pitcher'> = {};

      for (const valuation of valuationsResponse.data?.valuations ?? []) {
        averagedStatsByPlayerId[valuation.playerId] =
          valuation.averagedStats ?? {};
        if (valuation.playerType)
          playerTypeByPlayerId[valuation.playerId] = valuation.playerType;
      }

      return { averagedStatsByPlayerId, playerTypeByPlayerId };
    },
  });
}
