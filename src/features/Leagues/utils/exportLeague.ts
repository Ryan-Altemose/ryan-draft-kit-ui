import type { Player } from '@/shared/hooks/usePlayers';
import type { DraftPick, League, TakenPlayer } from '../types/leagues.types';

export type ExportedLeagueJson = {
  name: string;
  description?: string;
  format: League['format'];
  draftType: League['draftType'];
  leagueType?: League['leagueType'];
  battingCategories: string[];
  pitchingCategories: string[];
  rosterSlots: League['rosterSlots'];
  totalBudget?: number;
  categoryWeights?: League['categoryWeights'];
  minorLeagueSlotsPerTeam?: number;
  taxiSquadPlayersPerTeam?: number;
  teams: Array<{
    name: string;
    budget: number;
  }>;
  taken_players?: Array<{
    playerName: string;
    teamName: string;
    positionSlot: string;
    price: number;
    contract?: string;
  }>;
  draft_picks?: Array<{
    pickNumber: number;
    nominatingTeamName: string;
    winningTeamName: string;
    playerName: string;
    salary: number;
  }>;
};

function requirePlayerName(
  playerId: string,
  playerById: Map<string, Player>,
): string {
  const player = playerById.get(playerId);

  if (!player) {
    throw new Error(`Unable to export league: unknown player id ${playerId}`);
  }

  return player.name;
}

function requireTeamName(
  teamId: string,
  teamNameById: Map<string, string>,
): string {
  const teamName = teamNameById.get(teamId);

  if (!teamName) {
    throw new Error(`Unable to export league: unknown team id ${teamId}`);
  }

  return teamName;
}

function mapTakenPlayers(
  takenPlayers: TakenPlayer[] | undefined,
  playerById: Map<string, Player>,
  teamNameById: Map<string, string>,
): ExportedLeagueJson['taken_players'] {
  if (!takenPlayers || takenPlayers.length === 0) {
    return undefined;
  }

  return takenPlayers.map(
    ([playerId, teamId, positionSlot, price, contract]) => ({
      playerName: requirePlayerName(playerId, playerById),
      teamName: requireTeamName(teamId, teamNameById),
      positionSlot,
      price,
      contract: contract || undefined,
    }),
  );
}

function mapDraftPicks(
  draftPicks: DraftPick[] | undefined,
  playerById: Map<string, Player>,
  teamNameById: Map<string, string>,
): ExportedLeagueJson['draft_picks'] {
  if (!draftPicks || draftPicks.length === 0) {
    return undefined;
  }

  return draftPicks.map(
    ([pickNumber, nominatingTeamId, winningTeamId, playerId, salary]) => ({
      pickNumber,
      nominatingTeamName: requireTeamName(nominatingTeamId, teamNameById),
      winningTeamName: requireTeamName(winningTeamId, teamNameById),
      playerName: requirePlayerName(playerId, playerById),
      salary,
    }),
  );
}

export function toExportedLeagueJson(
  league: League,
  players: Player[],
): ExportedLeagueJson {
  const playerById = new Map(players.map((player) => [player._id, player]));
  const teams = league.teams ?? [];
  const teamNameById = new Map(
    teams.map(([teamId, teamName]) => [teamId, teamName]),
  );

  return {
    name: league.name,
    description: league.description,
    format: league.format,
    draftType: league.draftType,
    leagueType: league.leagueType,
    battingCategories: league.battingCategories,
    pitchingCategories: league.pitchingCategories,
    rosterSlots: league.rosterSlots,
    totalBudget: league.totalBudget,
    categoryWeights: league.categoryWeights,
    minorLeagueSlotsPerTeam: league.minorLeagueSlotsPerTeam,
    taxiSquadPlayersPerTeam: league.taxiSquadPlayersPerTeam,
    teams: teams.map(([, teamName, budget]) => ({
      name: teamName,
      budget,
    })),
    taken_players: mapTakenPlayers(
      league.taken_players,
      playerById,
      teamNameById,
    ),
    draft_picks: mapDraftPicks(league.draft_picks, playerById, teamNameById),
  };
}

function toFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'league'
  );
}

export function downloadLeagueJson(league: League, players: Player[]): void {
  const exportedLeague = toExportedLeagueJson(league, players);
  const blob = new Blob([JSON.stringify(exportedLeague, null, 2)], {
    type: 'application/json',
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${toFileName(league.name)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
