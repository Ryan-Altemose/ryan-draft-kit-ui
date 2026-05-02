import type {
  DraftPick,
  DraftStateJson,
  League,
  LeagueTeam,
  TakenPlayer,
} from '../types/leagues.types';

type SavedDraftStatePlayer = DraftStateJson['players'][number];

type LeagueSaveShape = {
  _id?: string;
  externalId: string;
  name: string;
  draftType: League['draftType'];
  totalBudget?: number;
  battingCategories: string[];
  pitchingCategories: string[];
  rosterSlots: League['rosterSlots'];
  minorLeagueSlotsPerTeam?: number;
  taken_players?: TakenPlayer[];
  draft_picks?: DraftPick[];
  teams?: LeagueTeam[];
  draftStateJson?: DraftStateJson;
};

function getTeamName(teams: LeagueTeam[] | undefined, teamId: string): string {
  return teams?.find(([id]) => id === teamId)?.[1] ?? teamId;
}

function buildSavedPlayerLookup(
  draftStateJson?: DraftStateJson,
): Map<string, SavedDraftStatePlayer> {
  return new Map(
    (draftStateJson?.players ?? []).map((player) => [player.playerId, player]),
  );
}

function buildPickLookup(draftPicks: DraftPick[]) {
  return new Map(
    draftPicks.map(
      ([pickNumber, nominatedByTeamId, draftedByTeamId, playerId]) => [
        `${playerId}:${draftedByTeamId}`,
        { pickNumber, nominatedByTeamId },
      ],
    ),
  );
}

export function buildDraftStateJsonFromLeagueSave(
  league: LeagueSaveShape,
): DraftStateJson {
  const teams = league.teams ?? [];
  const takenPlayers = league.taken_players ?? [];
  const draftPicks = league.draft_picks ?? [];
  const savedPlayerLookup = buildSavedPlayerLookup(league.draftStateJson);
  const pickLookup = buildPickLookup(draftPicks);

  const players: DraftStateJson['players'] = takenPlayers.map(
    ([playerId, draftedByTeamId, slot, purchasePrice]) => {
      const savedPlayer = savedPlayerLookup.get(playerId);
      const pick = pickLookup.get(`${playerId}:${draftedByTeamId}`);
      const nominatedByTeamId = pick?.nominatedByTeamId ?? draftedByTeamId;

      return {
        playerId,
        playerName: savedPlayer?.playerName ?? playerId,
        playerTeam: savedPlayer?.playerTeam ?? '',
        positions: savedPlayer?.positions ?? [],
        playerType: savedPlayer?.playerType ?? 'hitter',
        draftedByTeamId,
        draftedByTeamName: getTeamName(teams, draftedByTeamId),
        nominatedByTeamId,
        nominatedByTeamName: getTeamName(teams, nominatedByTeamId),
        slot,
        purchasePrice,
        pickNumber: pick?.pickNumber,
      };
    },
  );

  const teamSummaries: DraftStateJson['teams'] = teams.map(
    ([teamId, teamName]) => {
      const teamPlayers = players.filter(
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
      leagueId: league._id ?? '',
      externalId: league.externalId,
      name: league.name,
      draftType: league.draftType,
      totalBudget: league.totalBudget ?? 0,
      battingCategories:
        league.battingCategories as DraftStateJson['league']['battingCategories'],
      pitchingCategories:
        league.pitchingCategories as DraftStateJson['league']['pitchingCategories'],
      rosterSlots: league.rosterSlots,
      minorLeagueSlotsPerTeam: league.minorLeagueSlotsPerTeam ?? 0,
      teamCount: teams.length,
    },
    teams: teamSummaries,
    players,
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
        nominatedByTeamName: getTeamName(teams, nominatedByTeamId),
        draftedByTeamId,
        draftedByTeamName: getTeamName(teams, draftedByTeamId),
        playerId,
        playerName: savedPlayerLookup.get(playerId)?.playerName ?? playerId,
        purchasePrice,
      }),
    ),
  };
}
