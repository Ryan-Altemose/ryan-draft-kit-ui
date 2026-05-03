import { describe, expect, it } from 'vitest';
import type { League } from '@/features/Leagues/types/leagues.types';
import { buildLeagueDraftRosterJson } from './buildLeagueDraftRosterJson';

function buildLeague(overrides: Partial<League> = {}): League {
  return {
    _id: 'league-1',
    externalId: 'custom-league-1',
    name: 'Draft League',
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
    taken_players: [
      ['player-freddie', 'team-1', '1B-0', 35],
      ['player-adley', 'team-2', 'C-0', 22],
    ],
    draft_picks: [
      [1, 'team-2', 'team-2', 'player-adley', 22],
      [2, 'team-1', 'team-1', 'player-freddie', 35],
    ],
    teams: [
      ['team-1', 'Alpha', 225],
      ['team-2', 'Beta', 238],
    ],
    isDefault: false,
    ...overrides,
  };
}

describe('buildLeagueDraftRosterJson', () => {
  it('groups bought players by team with player names, ids, prices, and pick numbers', () => {
    const json = buildLeagueDraftRosterJson(
      [buildLeague()],
      [
        { _id: 'player-adley', name: 'Adley Rutschman' },
        { _id: 'player-freddie', name: 'Freddie Freeman' },
      ],
      '2026-05-03T18:00:00.000Z',
    );

    expect(json).toEqual({
      generatedAt: '2026-05-03T18:00:00.000Z',
      leagueCount: 1,
      leagues: [
        {
          leagueId: 'league-1',
          externalId: 'custom-league-1',
          leagueName: 'Draft League',
          totalBudget: 260,
          teams: [
            {
              teamId: 'team-1',
              teamName: 'Alpha',
              remainingBudget: 225,
              totalSpent: 35,
              players: [
                {
                  playerName: 'Freddie Freeman',
                  playerId: 'player-freddie',
                  priceBought: 35,
                  rosterSlot: '1B-0',
                  pickNumber: 2,
                },
              ],
            },
            {
              teamId: 'team-2',
              teamName: 'Beta',
              remainingBudget: 238,
              totalSpent: 22,
              players: [
                {
                  playerName: 'Adley Rutschman',
                  playerId: 'player-adley',
                  priceBought: 22,
                  rosterSlot: 'C-0',
                  pickNumber: 1,
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('falls back to player id when the player name is not available', () => {
    const json = buildLeagueDraftRosterJson(
      [
        buildLeague({
          taken_players: [['player-unknown', 'team-1', 'C-0', 10]],
          draft_picks: [],
        }),
      ],
      [],
      '2026-05-03T18:00:00.000Z',
    );

    expect(json.leagues[0].teams[0].players).toEqual([
      {
        playerName: 'player-unknown',
        playerId: 'player-unknown',
        priceBought: 10,
        rosterSlot: 'C-0',
        pickNumber: null,
      },
    ]);
  });
});
