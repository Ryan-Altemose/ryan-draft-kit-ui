import { useQuery } from '@tanstack/react-query';
import { fetchAllLeagueValuationsMap } from '../utils/fetchLeagueValuations';
import { upsertExternalLeague } from '../utils/upsertExternalLeague';
import type { League } from '@/features/Leagues/types/leagues.types';

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

function leagueValuationsFingerprint(league: League): string {
  // Include only fields that impact valuations output.
  // This makes react-query automatically refetch when the league rules/state changes,
  // even if the leagueId stays the same.
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

export function useLeagueValuations(league?: League | null) {
  return useQuery<Record<string, number>>({
    queryKey: league?._id
      ? ['league-valuations', league._id, leagueValuationsFingerprint(league)]
      : ['league-valuations', undefined],
    queryFn: async () => {
      const external = await upsertExternalLeague(league as League);
      return fetchAllLeagueValuationsMap(external.data._id);
    },
    enabled: Boolean(league?._id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
