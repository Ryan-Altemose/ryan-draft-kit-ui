import { describe, expect, it } from 'vitest';
import type {
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import {
  deriveDraftPicksFromTakenPlayers,
  ensureLeagueHasDraftPicks,
} from './draftPicks';

const BASE_LEAGUE = {
  _id: 'league-1',
  externalId: 'ext-1',
  name: 'League',
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
  teams: [['team-1', 'Team 1', 260]],
  isDefault: false,
} as const;

describe('draftPicks utils', () => {
  it('deriveDraftPicksFromTakenPlayers always returns an empty array', () => {
    const takenPlayers: TakenPlayer[] = [
      ['player-1', 'team-1', 'C-0', 10],
      ['player-2', 'team-2', '1B-0', 25],
    ];
    expect(deriveDraftPicksFromTakenPlayers(takenPlayers)).toEqual([]);
  });

  it('ensureLeagueHasDraftPicks preserves existing draft_picks', () => {
    const league = {
      ...BASE_LEAGUE,
      taken_players: [['player-1', 'team-1', 'C-0', 10]],
      draft_picks: [[1, 'team-1', 'team-1', 'player-1', 10]],
    } satisfies League;

    const ensured = ensureLeagueHasDraftPicks(league);
    expect(ensured.draft_picks).toEqual([
      [1, 'team-1', 'team-1', 'player-1', 10],
    ]);
  });

  it('ensureLeagueHasDraftPicks initializes draft_picks to an empty array when absent', () => {
    const league = {
      ...BASE_LEAGUE,
      taken_players: [['player-1', 'team-1', 'C-0', 10]],
    } satisfies League;

    const ensured = ensureLeagueHasDraftPicks(league);
    expect(ensured.draft_picks).toEqual([]);
  });
});
