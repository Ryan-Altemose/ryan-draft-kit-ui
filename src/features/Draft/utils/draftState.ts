import type {
  CreateLeagueInput,
  DraftStateJson,
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import type { Player } from '@/shared/hooks/usePlayers';
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

function buildPlayerLookup(players: Player[]): Map<string, Player> {
  return new Map(players.map((player) => [player._id, player]));
}

function buildPickLookup(
  draftPicks: DraftPick[],
): Map<string, { pickNumber: number; nominatedByTeamId: string }> {
  return new Map(
    draftPicks.map(
      ([pickNumber, nominatedByTeamId, winningTeamId, playerId]) => [
        `${playerId}:${winningTeamId}`,
        { pickNumber, nominatedByTeamId },
      ],
    ),
  );
}

function getTeamName(league: League, teamId: string): string {
  return league.teams?.find(([id]) => id === teamId)?.[1] ?? teamId;
}

export function toDraftStateJson(
  league: League,
  players: Player[],
): DraftStateJson {
  const allPlayers = buildPlayerLookup(players);
  const takenPlayers = league.taken_players ?? [];
  const draftPicks = league.draft_picks ?? [];
  const pickLookup = buildPickLookup(draftPicks);

  const playerRecords: DraftStateJson['players'] = takenPlayers.map(
    ([playerId, draftedByTeamId, slot, purchasePrice]) => {
      const player = allPlayers.get(playerId);
      const pick = pickLookup.get(`${playerId}:${draftedByTeamId}`);
      const nominatedByTeamId = pick?.nominatedByTeamId ?? draftedByTeamId;

      return {
        playerId,
        playerName: player?.name ?? playerId,
        playerTeam: player?.team ?? '',
        positions: player?.positions ?? [],
        playerType: player?.playerType ?? 'hitter',
        draftedByTeamId,
        draftedByTeamName: getTeamName(league, draftedByTeamId),
        nominatedByTeamId,
        nominatedByTeamName: getTeamName(league, nominatedByTeamId),
        slot,
        purchasePrice,
        pickNumber: pick?.pickNumber,
      };
    },
  );

  const teamRecords: DraftStateJson['teams'] = (league.teams ?? []).map(
    ([teamId, teamName]) => {
      const teamPlayers = playerRecords.filter(
        (player) => player.draftedByTeamId === teamId,
      );
      const budgetSpent = teamPlayers.reduce(
        (sum, player) => sum + player.purchasePrice,
        0,
      );

      return {
        teamId,
        teamName,
        budgetRemaining: Math.max(0, (league.totalBudget ?? 0) - budgetSpent),
        budgetSpent,
        players: teamPlayers,
      };
    },
  );

  return {
    league: {
      leagueId: league._id,
      externalId: league.externalId,
      name: league.name,
      draftType: league.draftType,
      totalBudget: league.totalBudget ?? 0,
      battingCategories: league.battingCategories,
      pitchingCategories: league.pitchingCategories,
      rosterSlots: league.rosterSlots,
      minorLeagueSlotsPerTeam: league.minorLeagueSlotsPerTeam ?? 0,
      teamCount: league.teams?.length ?? 0,
    },
    teams: teamRecords,
    players: playerRecords,
    draftPicks: draftPicks.map(
      ([
        pickNumber,
        nominatedByTeamId,
        draftedByTeamId,
        playerId,
        purchasePrice,
      ]) => ({
        pickNumber,
        nominatedByTeamId,
        nominatedByTeamName: getTeamName(league, nominatedByTeamId),
        draftedByTeamId,
        draftedByTeamName: getTeamName(league, draftedByTeamId),
        playerId,
        playerName: allPlayers.get(playerId)?.name ?? playerId,
        purchasePrice,
      }),
    ),
  };
}

export function serializeDraftStateJson(
  league: League,
  players: Player[],
): string {
  return JSON.stringify(toDraftStateJson(league, players), null, 2);
}
