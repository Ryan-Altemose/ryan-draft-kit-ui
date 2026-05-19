import { describe, expect, it } from 'vitest';
import type { Player } from '@/shared/hooks/usePlayers';
import type { League } from '../types/leagues.types';
import { toExportedLeagueJson } from './exportLeague';

describe('toExportedLeagueJson', () => {
  it('maps a live league into import JSON format', () => {
    const league: League = {
      _id: 'league-1',
      externalId: 'league-1',
      name: 'Export Test League',
      description: 'Exported league',
      format: 'roto',
      draftType: 'auction',
      leagueType: 'MLB',
      battingCategories: ['AVG', 'HR', 'RBI', 'BB', 'SB'],
      pitchingCategories: ['ERA', 'W', 'L', 'SV', 'K', 'IP'],
      rosterSlots: {
        C: 1,
        '1B': 1,
        '2B': 1,
        '3B': 1,
        SS: 1,
        CI: 1,
        MI: 1,
        OF: 3,
        SP: 5,
        RP: 2,
        UTIL: 1,
        P: 0,
        BENCH: 5,
      },
      totalBudget: 260,
      teams: [
        ['team-1', 'Team 1', 218],
        ['team-2', 'Team 2', 221],
      ],
      taken_players: [
        ['player-1', 'team-1', 'OF-0', 42, 'A'],
        ['player-2', 'team-2', 'MiLB-0', 0, ''],
      ],
      draft_picks: [[1, 'team-1', 'team-1', 'player-1', 42]],
      minorLeagueSlotsPerTeam: 1,
      taxiSquadPlayersPerTeam: 1,
      isDefault: false,
    };

    const players: Player[] = [
      {
        _id: 'player-1',
        name: 'Ronald Acuña Jr.',
        positions: ['OF'],
        playerType: 'hitter',
        team: 'ATL',
      },
      {
        _id: 'player-2',
        name: 'Jackson Jobe',
        positions: ['SP'],
        playerType: 'pitcher',
        team: 'DET',
      },
    ];

    expect(toExportedLeagueJson(league, players)).toEqual({
      name: 'Export Test League',
      description: 'Exported league',
      format: 'roto',
      draftType: 'auction',
      leagueType: 'MLB',
      battingCategories: ['AVG', 'HR', 'RBI', 'BB', 'SB'],
      pitchingCategories: ['ERA', 'W', 'L', 'SV', 'K', 'IP'],
      rosterSlots: {
        C: 1,
        '1B': 1,
        '2B': 1,
        '3B': 1,
        SS: 1,
        CI: 1,
        MI: 1,
        OF: 3,
        SP: 5,
        RP: 2,
        UTIL: 1,
        P: 0,
        BENCH: 5,
      },
      totalBudget: 260,
      minorLeagueSlotsPerTeam: 1,
      taxiSquadPlayersPerTeam: 1,
      teams: [
        { name: 'Team 1', budget: 218 },
        { name: 'Team 2', budget: 221 },
      ],
      taken_players: [
        {
          playerName: 'Ronald Acuña Jr.',
          teamName: 'Team 1',
          positionSlot: 'OF-0',
          price: 42,
          contract: 'A',
        },
        {
          playerName: 'Jackson Jobe',
          teamName: 'Team 2',
          positionSlot: 'MiLB-0',
          price: 0,
          contract: undefined,
        },
      ],
      draft_picks: [
        {
          pickNumber: 1,
          nominatingTeamName: 'Team 1',
          winningTeamName: 'Team 1',
          playerName: 'Ronald Acuña Jr.',
          salary: 42,
        },
      ],
    });
  });
});
