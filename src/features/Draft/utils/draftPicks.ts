import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';

export function deriveDraftPicksFromTakenPlayers(
  takenPlayers: TakenPlayer[],
): DraftPick[] {
  const draftEntries = takenPlayers.filter(([, , slot]) => slot === 'DRAFT');

  return draftEntries.map(([playerId, winningTeamId, , salary], index) => {
    const pickNumber = index + 1;
    const nominatingTeamId = winningTeamId;
    return [pickNumber, nominatingTeamId, winningTeamId, playerId, salary];
  });
}

export function ensureLeagueHasDraftPicks(league: League): League {
  if (league.draft_picks && league.draft_picks.length > 0) return league;

  const takenPlayers = league.taken_players ?? [];
  const derived = deriveDraftPicksFromTakenPlayers(takenPlayers);
  if (derived.length === 0) return league;

  return { ...league, draft_picks: derived };
}
