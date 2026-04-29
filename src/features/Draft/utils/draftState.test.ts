import { describe, expect, it } from 'vitest';
import type {
  DraftPick,
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import {
  applyDraftPick,
  initializeDraftState,
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
});
