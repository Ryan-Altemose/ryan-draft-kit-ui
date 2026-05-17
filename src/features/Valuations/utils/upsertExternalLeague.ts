import { externalApiClient } from '@/shared/utils/api-client';
import type { League } from '@/features/Leagues/types/leagues.types';
import type { ExternalLeagueResponse } from '../types/valuations.types';

type ExternalLeagueUpsertPayload = {
  externalId: string;
  name: string;
  description?: string;
  format: 'roto' | 'h2h-points' | 'h2h-category';
  draftType: 'auction' | 'snake';
  battingCategories: string[];
  pitchingCategories: string[];
  rosterSlots: Record<string, number>;
  totalBudget?: number;
  taken_players?: unknown[];
  draft_picks?: unknown[];
  teams?: unknown[];
  categoryWeights?: Record<string, number>;
};

function toExternalLeaguePayload(league: League): ExternalLeagueUpsertPayload {
  const rosterSlots = league.rosterSlots as unknown as Record<string, number>;

  return {
    externalId: league.externalId,
    name: league.name,
    description: league.description,
    format: league.format,
    draftType: league.draftType,
    battingCategories: league.battingCategories,
    pitchingCategories: league.pitchingCategories,
    rosterSlots: {
      C: rosterSlots.C ?? 0,
      '1B': rosterSlots['1B'] ?? 0,
      '2B': rosterSlots['2B'] ?? 0,
      '3B': rosterSlots['3B'] ?? 0,
      SS: rosterSlots.SS ?? 0,
      OF: rosterSlots.OF ?? 0,
      DH: rosterSlots.DH ?? 0,
      SP: rosterSlots.SP ?? 0,
      RP: rosterSlots.RP ?? 0,
      UTIL: rosterSlots.UTIL ?? 0,
      BENCH: rosterSlots.BENCH ?? 0,
    },
    totalBudget: league.totalBudget,
    taken_players: league.taken_players,
    draft_picks: league.draft_picks,
    teams: league.teams,
    categoryWeights: league.categoryWeights,
  };
}

export async function upsertExternalLeague(
  league: League,
): Promise<ExternalLeagueResponse> {
  const payload = toExternalLeaguePayload(league);
  return externalApiClient.post<ExternalLeagueResponse>(
    '/api/leagues',
    payload,
  );
}
