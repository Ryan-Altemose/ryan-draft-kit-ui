import { describe, expect, it } from 'vitest';
import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import type { Player } from '@/shared/hooks/usePlayers';
import {
  applyDraftPick,
  initializeDraftState,
  serializeDraftStateJson,
  toDraftStateJson,
  toDraftLeagueInput,
  undoLastDraftPick,
} from './draftState';

function buildLeague(overrides: Partial<League> = {}): League {
  return {
    _id: 'league-1',
    externalId: 'ext-1',
    name: 'League',
    description: '2 teams',
    format: 'roto',
    draftType: 'auction',
    battingCategories: ['R'],
    pitchingCategories: ['K'],
    rosterSlots: {
      C: 1,
      '1B': 1,
      '2B': 1,
      '3B': 1,
      SS: 1,
      CI: 0,
      MI: 0,
      OF: 3,
      SP: 5,
      RP: 2,
      UTIL: 0,
      BENCH: 0,
    },
    totalBudget: 260,
    taken_players: [],
    draft_picks: [],
    teams: [
      ['team-1', 'Alpha', 260],
      ['team-2', 'Beta', 260],
    ],
    isDefault: false,
    ...overrides,
  };
}

describe('draftState utils', () => {
  const pick: DraftPick = [1, 'team-1', 'team-2', 'player-1', 22];
  const takenEntry: TakenPlayer = ['player-1', 'team-2', 'DRAFT', 22];
  const players: Player[] = [
    {
      _id: 'player-1',
      name: 'Adley Rutschman',
      positions: ['C'],
      playerType: 'hitter',
      team: 'BAL',
    },
    {
      _id: 'player-9',
      name: 'Tarik Skubal',
      positions: ['SP'],
      playerType: 'pitcher',
      team: 'DET',
    },
  ];

  it('initializes draft state from taken players when draft picks are missing', () => {
    const league = buildLeague({
      draft_picks: undefined,
      taken_players: [['player-1', 'team-1', 'DRAFT', 10]],
    });

    expect(initializeDraftState(league).draft_picks).toEqual([
      [1, 'team-1', 'team-1', 'player-1', 10],
    ]);
  });

  it('adds a draft pick and matching taken player entry', () => {
    const league = buildLeague();

    expect(applyDraftPick(league, pick, takenEntry)).toMatchObject({
      draft_picks: [pick],
      taken_players: [takenEntry],
    });
  });

  it('undoes the latest draft pick and removes only its matching DRAFT taken player entry', () => {
    const league = buildLeague({
      draft_picks: [[1, 'team-1', 'team-1', 'player-9', 11], pick],
      taken_players: [
        ['player-9', 'team-1', 'DRAFT', 11],
        ['player-1', 'team-2', 'BENCH-0', 22],
        takenEntry,
      ],
    });

    expect(undoLastDraftPick(league)).toMatchObject({
      draft_picks: [[1, 'team-1', 'team-1', 'player-9', 11]],
      taken_players: [
        ['player-9', 'team-1', 'DRAFT', 11],
        ['player-1', 'team-2', 'BENCH-0', 22],
      ],
    });
  });

  it('returns the original league when undo is called with no draft picks', () => {
    const league = buildLeague({
      taken_players: [['player-1', 'team-2', 'DRAFT', 22]],
    });

    expect(undoLastDraftPick(league)).toBe(league);
  });

  it('formats the current draft state into the league upsert payload shape', () => {
    const league = buildLeague({
      minorLeagueSlotsPerTeam: 4,
      draft_picks: [pick],
      taken_players: [takenEntry],
    });

    expect(toDraftLeagueInput(league)).toEqual({
      name: 'League',
      teams: 2,
      draftType: 'auction',
      rosterSlots: league.rosterSlots,
      totalBudget: 260,
      battingCategories: ['R'],
      pitchingCategories: ['K'],
      minorLeagueSlotsPerTeam: 4,
      takenPlayers: [takenEntry],
      draftPicks: [pick],
      teamsData: league.teams,
    });
  });

  it('formats the current draft state into JSON with league, teams, players, and draft pick details', () => {
    const secondPick: DraftPick = [2, 'team-1', 'team-2', 'player-1', 22];
    const league = buildLeague({
      draft_picks: [[1, 'team-1', 'team-1', 'player-9', 11], secondPick],
      taken_players: [['player-9', 'team-1', 'SP-0', 11], takenEntry],
    });

    expect(toDraftStateJson(league, players)).toEqual({
      league: {
        leagueId: 'league-1',
        externalId: 'ext-1',
        name: 'League',
        draftType: 'auction',
        totalBudget: 260,
        battingCategories: ['R'],
        pitchingCategories: ['K'],
        rosterSlots: league.rosterSlots,
        minorLeagueSlotsPerTeam: 0,
        teamCount: 2,
      },
      teams: [
        {
          teamId: 'team-1',
          teamName: 'Alpha',
          budgetRemaining: 249,
          budgetSpent: 11,
          players: [
            {
              playerId: 'player-9',
              playerName: 'Tarik Skubal',
              playerTeam: 'DET',
              positions: ['SP'],
              playerType: 'pitcher',
              draftedByTeamId: 'team-1',
              draftedByTeamName: 'Alpha',
              nominatedByTeamId: 'team-1',
              nominatedByTeamName: 'Alpha',
              slot: 'SP-0',
              purchasePrice: 11,
              pickNumber: 1,
            },
          ],
        },
        {
          teamId: 'team-2',
          teamName: 'Beta',
          budgetRemaining: 238,
          budgetSpent: 22,
          players: [
            {
              playerId: 'player-1',
              playerName: 'Adley Rutschman',
              playerTeam: 'BAL',
              positions: ['C'],
              playerType: 'hitter',
              draftedByTeamId: 'team-2',
              draftedByTeamName: 'Beta',
              nominatedByTeamId: 'team-1',
              nominatedByTeamName: 'Alpha',
              slot: 'DRAFT',
              purchasePrice: 22,
              pickNumber: 2,
            },
          ],
        },
      ],
      players: [
        {
          playerId: 'player-9',
          playerName: 'Tarik Skubal',
          playerTeam: 'DET',
          positions: ['SP'],
          playerType: 'pitcher',
          draftedByTeamId: 'team-1',
          draftedByTeamName: 'Alpha',
          nominatedByTeamId: 'team-1',
          nominatedByTeamName: 'Alpha',
          slot: 'SP-0',
          purchasePrice: 11,
          pickNumber: 1,
        },
        {
          playerId: 'player-1',
          playerName: 'Adley Rutschman',
          playerTeam: 'BAL',
          positions: ['C'],
          playerType: 'hitter',
          draftedByTeamId: 'team-2',
          draftedByTeamName: 'Beta',
          nominatedByTeamId: 'team-1',
          nominatedByTeamName: 'Alpha',
          slot: 'DRAFT',
          purchasePrice: 22,
          pickNumber: 2,
        },
      ],
      draftPicks: [
        {
          pickNumber: 1,
          nominatedByTeamId: 'team-1',
          nominatedByTeamName: 'Alpha',
          draftedByTeamId: 'team-1',
          draftedByTeamName: 'Alpha',
          playerId: 'player-9',
          playerName: 'Tarik Skubal',
          purchasePrice: 11,
        },
        {
          pickNumber: 2,
          nominatedByTeamId: 'team-1',
          nominatedByTeamName: 'Alpha',
          draftedByTeamId: 'team-2',
          draftedByTeamName: 'Beta',
          playerId: 'player-1',
          playerName: 'Adley Rutschman',
          purchasePrice: 22,
        },
      ],
    });
  });

  it('falls back to ids when player metadata is missing from the loaded player list', () => {
    const league = buildLeague({
      draft_picks: [pick],
      taken_players: [takenEntry],
    });

    expect(toDraftStateJson(league, [])).toMatchObject({
      players: [
        {
          playerId: 'player-1',
          playerName: 'player-1',
          playerTeam: '',
          positions: [],
          draftedByTeamName: 'Beta',
          purchasePrice: 22,
          pickNumber: 1,
        },
      ],
    });
  });

  it('serializes the draft state export as pretty-printed JSON', () => {
    const league = buildLeague({
      draft_picks: [pick],
      taken_players: [takenEntry],
    });

    const serialized = serializeDraftStateJson(league, players);

    expect(typeof serialized).toBe('string');
    expect(JSON.parse(serialized)).toEqual(toDraftStateJson(league, players));
    expect(serialized).toContain('\n  "league"');
  });
});
