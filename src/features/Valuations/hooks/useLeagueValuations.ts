import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAllLeagueValuationsMap,
  fetchLeagueValuationsPage,
} from '../utils/fetchLeagueValuations';
import { upsertExternalLeague } from '../utils/upsertExternalLeague';
import type { League } from '@/features/Leagues/types/leagues.types';
import type { PlayerValuation } from '../types/valuations.types';

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
  // This lets the progressive valuations loader restart when league rules/state
  // change, even if the leagueId stays the same.
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

const PREVIEW_LIMIT = 10;

export function useLeagueValuations(league?: League | null) {
  const [showPreviewFirst, setShowPreviewFirst] = useState(false);
  const [previewStartedAt, setPreviewStartedAt] = useState<number | null>(null);

  const fullQuery = useQuery<Record<string, number>>({
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

  const previewQuery = useQuery<PlayerValuation[]>({
    queryKey: league?._id
      ? [
          'league-valuations-preview',
          league._id,
          leagueValuationsFingerprint(league),
        ]
      : ['league-valuations-preview', undefined],
    queryFn: async () => {
      const external = await upsertExternalLeague(league as League);
      const response = await fetchLeagueValuationsPage(
        external.data._id,
        1,
        PREVIEW_LIMIT,
      );
      return response.data?.valuations ?? [];
    },
    enabled: Boolean(league?._id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!league?._id) {
      setShowPreviewFirst(false);
      setPreviewStartedAt(null);
      return;
    }

    setPreviewStartedAt(Date.now());
    setShowPreviewFirst(true);
  }, [league?._id, league ? leagueValuationsFingerprint(league) : undefined]);

  useEffect(() => {
    if (!showPreviewFirst) return;
    if (!previewStartedAt) return;
    if (fullQuery.isFetching || previewQuery.isFetching) return;
    if (fullQuery.dataUpdatedAt < previewStartedAt) return;
    if (previewQuery.dataUpdatedAt < previewStartedAt) return;

    setShowPreviewFirst(false);
  }, [
    showPreviewFirst,
    fullQuery.isFetching,
    previewQuery.isFetching,
    fullQuery.dataUpdatedAt,
    previewQuery.dataUpdatedAt,
    previewStartedAt,
  ]);

  return {
    data: fullQuery.data ?? {},
    previewRows: previewQuery.data ?? [],
    isLoading: fullQuery.isLoading,
    isLoadingPreview: previewQuery.isLoading,
    showPreviewFirst,
  };
}
