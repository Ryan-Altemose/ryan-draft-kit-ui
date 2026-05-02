import { localApiClient } from '@/shared/utils/api-client';
import type {
  CreateLeagueInput,
  CreateLeagueResponse,
  DraftPick,
  DraftStateJson,
  League,
  LeagueTeam,
  TakenPlayer,
} from '../types/leagues.types';
import { buildDraftStateJsonFromLeagueSave } from './draftStateJson';

type UpsertLeagueOptions = {
  endpoint?: '/api/leagues' | '/api/draft-save/leagues';
};

// const DEFAULT_BATTING_CATEGORIES = ['R', 'HR', 'RBI', 'SB', 'AVG'] as const;
// const DEFAULT_PITCHING_CATEGORIES = ['W', 'SV', 'K', 'ERA', 'WHIP'] as const;

function toExternalId(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `custom-${slug || 'league'}-${Date.now()}`;
}

function toTeamId(index: number): string {
  return `team-${index + 1}`;
}

function calculateCurrentBudget(
  startingBudget: number,
  takenPlayers: TakenPlayer[],
  teamId: string,
): number {
  const spent = takenPlayers.reduce((sum, [, takenTeamId, , price]) => {
    if (takenTeamId !== teamId) return sum;
    return sum + price;
  }, 0);

  return Math.max(0, startingBudget - spent);
}

function buildLeagueTeams(
  teamCount: number,
  startingBudget: number,
  takenPlayers: TakenPlayer[],
  existingTeams?: LeagueTeam[],
): LeagueTeam[] {
  return Array.from({ length: teamCount }, (_, index) => {
    const existingTeam = existingTeams?.[index];
    const teamId = existingTeam?.[0] ?? toTeamId(index);
    const teamName = existingTeam?.[1] ?? `Team ${index + 1}`;

    return [
      teamId,
      teamName,
      calculateCurrentBudget(startingBudget, takenPlayers, teamId),
    ];
  });
}

export async function upsertLeague(
  input: CreateLeagueInput,
  existingLeague?: League,
  options?: UpsertLeagueOptions,
): Promise<CreateLeagueResponse> {
  if (existingLeague && !existingLeague.externalId) {
    throw new Error(
      'Unable to update league: missing externalId. Refresh and try again.',
    );
  }

  const externalId = existingLeague?.externalId ?? toExternalId(input.name);
  const takenPlayers =
    input.takenPlayers ?? existingLeague?.taken_players ?? [];
  const draftPicks: DraftPick[] =
    input.draftPicks ?? existingLeague?.draft_picks ?? [];
  const teams = buildLeagueTeams(
    input.teams,
    input.totalBudget,
    takenPlayers,
    input.teamsData ?? existingLeague?.teams,
  );
  const draftStateJson: DraftStateJson = input.draftStateJson
    ? input.draftStateJson
    : buildDraftStateJsonFromLeagueSave({
        _id: existingLeague?._id,
        externalId,
        name: input.name,
        draftType: input.draftType,
        totalBudget: input.totalBudget,
        battingCategories: input.battingCategories,
        pitchingCategories: input.pitchingCategories,
        rosterSlots: input.rosterSlots,
        minorLeagueSlotsPerTeam:
          input.minorLeagueSlotsPerTeam ??
          existingLeague?.minorLeagueSlotsPerTeam,
        taken_players: takenPlayers,
        draft_picks: draftPicks,
        teams,
        draftStateJson: existingLeague?.draftStateJson as
          | DraftStateJson
          | undefined,
      });

  const response = await localApiClient.post<CreateLeagueResponse>(
    options?.endpoint ?? '/api/leagues',
    {
      externalId,
      name: input.name,
      description: `${input.teams} teams`,
      format: existingLeague?.format ?? 'roto',
      draftType: input.draftType,
      battingCategories: input.battingCategories,
      pitchingCategories: input.pitchingCategories,
      rosterSlots: input.rosterSlots,
      totalBudget: input.totalBudget,
      taken_players: takenPlayers,
      draft_picks: draftPicks,
      teams,
      draftStateJson,
      isDefault: existingLeague?.isDefault ?? false,
      categoryWeights: existingLeague?.categoryWeights,
      minorLeagueSlotsPerTeam:
        input.minorLeagueSlotsPerTeam ??
        existingLeague?.minorLeagueSlotsPerTeam,
    },
  );

  if (!response.data.draftStateJson) {
    response.data = {
      ...response.data,
      draftStateJson,
    };
  }

  return response;
}
