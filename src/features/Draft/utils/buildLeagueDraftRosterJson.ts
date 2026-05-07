import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import type { Player } from '@/shared/hooks/usePlayers';

type PlayerLookupRecord = Pick<Player, '_id' | 'name'>;

export type LeagueDraftRosterJson = {
  generatedAt: string;
  leagueCount: number;
  leagues: Array<{
    leagueId: string;
    externalId: string;
    leagueName: string;
    totalBudget: number;
    teams: Array<{
      teamId: string;
      teamName: string;
      remainingBudget: number;
      totalSpent: number;
      players: Array<{
        playerName: string;
        playerId: string;
        priceBought: number;
        rosterSlot: string;
        pickNumber: number | null;
      }>;
    }>;
  }>;
};

function buildPlayerNameLookup(players: PlayerLookupRecord[]) {
  return new Map(players.map((player) => [player._id, player.name]));
}

function buildPickNumberLookup(draftPicks: DraftPick[]) {
  return new Map(
    draftPicks.map(([pickNumber, , winningTeamId, playerId]) => [
      `${playerId}:${winningTeamId}`,
      pickNumber,
    ]),
  );
}

function getPickNumber(
  pickLookup: Map<string, number>,
  [playerId, teamId]: TakenPlayer,
) {
  return pickLookup.get(`${playerId}:${teamId}`) ?? null;
}

function sortPlayersByPickThenName(
  players: LeagueDraftRosterJson['leagues'][number]['teams'][number]['players'],
) {
  return [...players].sort((a, b) => {
    if (a.pickNumber !== null && b.pickNumber !== null) {
      return a.pickNumber - b.pickNumber;
    }

    if (a.pickNumber !== null) return -1;
    if (b.pickNumber !== null) return 1;

    return a.playerName.localeCompare(b.playerName);
  });
}

export function buildLeagueDraftRosterJson(
  leagues: League[],
  players: PlayerLookupRecord[] = [],
  generatedAt: string = new Date().toISOString(),
): LeagueDraftRosterJson {
  const playerNameLookup = buildPlayerNameLookup(players);

  return {
    generatedAt,
    leagueCount: leagues.length,
    leagues: leagues.map((league) => {
      const takenPlayers = league.taken_players ?? [];
      const pickLookup = buildPickNumberLookup(league.draft_picks ?? []);

      return {
        leagueId: league._id,
        externalId: league.externalId,
        leagueName: league.name,
        totalBudget: league.totalBudget ?? 0,
        teams: (league.teams ?? []).map(
          ([teamId, teamName, remainingBudget]) => {
            const teamPlayers = takenPlayers
              .filter(([, takenTeamId]) => takenTeamId === teamId)
              .map((takenPlayer) => {
                const [playerId, , rosterSlot, priceBought] = takenPlayer;

                return {
                  playerName: playerNameLookup.get(playerId) ?? playerId,
                  playerId,
                  priceBought,
                  rosterSlot,
                  pickNumber: getPickNumber(pickLookup, takenPlayer),
                };
              });

            return {
              teamId,
              teamName,
              remainingBudget,
              totalSpent: teamPlayers.reduce(
                (sum, player) => sum + player.priceBought,
                0,
              ),
              players: sortPlayersByPickThenName(teamPlayers),
            };
          },
        ),
      };
    }),
  };
}
