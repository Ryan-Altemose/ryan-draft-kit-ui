import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';

export function deriveDraftPicksFromTakenPlayers(
  _takenPlayers: TakenPlayer[],
): DraftPick[] {
  return [];
}

export function ensureLeagueHasDraftPicks(league: League): League {
  return { ...league, draft_picks: league.draft_picks ?? [] };
}
