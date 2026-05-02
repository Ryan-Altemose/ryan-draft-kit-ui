import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';

type DraftTakenPlayer = [
  string,
  string,
  string,
  number,
  [number, string, string],
];

function isDraftTakenPlayer(entry: TakenPlayer): entry is DraftTakenPlayer {
  return entry.length === 5;
}

export function deriveDraftPicksFromTakenPlayers(
  takenPlayers: TakenPlayer[],
): DraftPick[] {
  return takenPlayers
    .filter(isDraftTakenPlayer)
    .map(
      ([
        playerId,
        ,
        ,
        salary,
        [pickNumber, nominatingId, winningId],
      ]): DraftPick => [pickNumber, nominatingId, winningId, playerId, salary],
    )
    .sort((left, right) => left[0] - right[0]);
}

export function ensureLeagueHasDraftPicks(league: League): League {
  const takenPlayers = league.taken_players ?? [];
  const derived = deriveDraftPicksFromTakenPlayers(takenPlayers);
  return { ...league, draft_picks: derived };
}
