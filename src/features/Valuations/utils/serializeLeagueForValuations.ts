import type { League } from '@/features/Leagues/types/leagues.types';

export type ValuationLeaguePayload = {
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

export function serializeLeagueForValuations(
  league: League,
): ValuationLeaguePayload {
  const rosterSlots = league.rosterSlots as unknown as Record<string, number>;

  return {
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
      CI: rosterSlots.CI ?? 0,
      MI: rosterSlots.MI ?? 0,
      OF: rosterSlots.OF ?? 0,
      DH: rosterSlots.DH ?? 0,
      SP: rosterSlots.SP ?? 0,
      RP: rosterSlots.RP ?? 0,
      P: rosterSlots.P ?? 0,
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
