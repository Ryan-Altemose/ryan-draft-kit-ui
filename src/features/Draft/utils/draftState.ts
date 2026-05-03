import type {
  CreateLeagueInput,
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import { ensureLeagueHasDraftPicks } from './draftPicks';

export function initializeDraftState(league: League): League {
  return ensureLeagueHasDraftPicks(league);
}

export function applyDraftPick(
  league: League,
  pick: DraftPick,
  takenEntry: TakenPlayer,
): League {
  return {
    ...league,
    taken_players: [...(league.taken_players ?? []), takenEntry],
    draft_picks: [...(league.draft_picks ?? []), pick],
  };
}

export function undoLastDraftPick(league: League): League {
  const draftPicks = league.draft_picks ?? [];
  if (draftPicks.length === 0) return league;

  const [, , winningTeamId, playerId] = draftPicks[draftPicks.length - 1];

  let removed = false;
  const nextTakenPlayers = (league.taken_players ?? []).filter(
    ([takenPlayerId, takenTeamId, slot]) => {
      if (
        !removed &&
        takenPlayerId === playerId &&
        takenTeamId === winningTeamId &&
        slot === 'DRAFT'
      ) {
        removed = true;
        return false;
      }

      return true;
    },
  );

  return {
    ...league,
    taken_players: nextTakenPlayers,
    draft_picks: draftPicks.slice(0, -1),
  };
}

export function toDraftLeagueInput(league: League): CreateLeagueInput {
  return {
    name: league.name,
    teams: league.teams?.length ?? 0,
    draftType: league.draftType as 'auction',
    rosterSlots: league.rosterSlots,
    totalBudget: league.totalBudget ?? 0,
    battingCategories: league.battingCategories,
    pitchingCategories: league.pitchingCategories,
    minorLeagueSlotsPerTeam: league.minorLeagueSlotsPerTeam,
    takenPlayers: league.taken_players ?? [],
    draftPicks: league.draft_picks ?? [],
    teamsData: league.teams,
  };
}
