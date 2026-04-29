import { describe, expect, it } from 'vitest';
import type {
  League,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';
import {
  deriveDraftPicksFromTakenPlayers,
  ensureLeagueHasDraftPicks,
} from './draftPicks';

describe('draftPicks utils', () => {
  it('derives draft picks from taken_players with DRAFT slot', () => {
    const takenPlayers: TakenPlayer[] = [
      ['player-1', 'team-1', 'DRAFT', 10],
      ['player-2', 'team-2', 'C-0', 25],
      ['player-3', 'team-2', 'DRAFT', 15],
    ];

    expect(deriveDraftPicksFromTakenPlayers(takenPlayers)).toEqual([
      [1, 'team-1', 'team-1', 'player-1', 10],
      [2, 'team-2', 'team-2', 'player-3', 15],
    ]);
  });

  it('fills league.draft_picks when missing but draft entries exist', () => {
    const league = {
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
      taken_players: [['player-1', 'team-1', 'DRAFT', 10]],
      teams: [['team-1', 'Team 1', 250]],
      isDefault: false,
    } satisfies League;

    const ensured = ensureLeagueHasDraftPicks(league);
    expect(ensured.draft_picks).toEqual([
      [1, 'team-1', 'team-1', 'player-1', 10],
    ]);
  });

  it('does not overwrite existing league.draft_picks', () => {
    const league = {
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
      taken_players: [['player-1', 'team-1', 'DRAFT', 10]],
      draft_picks: [[99, 'team-x', 'team-y', 'player-z', 1]],
      teams: [['team-1', 'Team 1', 250]],
      isDefault: false,
    } satisfies League;

    const ensured = ensureLeagueHasDraftPicks(league);
    expect(ensured.draft_picks).toEqual([
      [99, 'team-x', 'team-y', 'player-z', 1],
    ]);
  });
});
