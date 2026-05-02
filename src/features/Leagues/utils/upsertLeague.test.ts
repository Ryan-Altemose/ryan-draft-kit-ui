import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from '@/shared/constants';
import type { League } from '../types/leagues.types';
import { upsertLeague } from './upsertLeague';

describe('upsertLeague', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('test-user-id'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { _id: 'league-1', name: 'League' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates default teams and an empty taken_players array for new leagues', async () => {
    await upsertLeague({
      name: 'Budget League',
      teams: 3,
      draftType: 'auction',
      rosterSlots: {
        C: 1,
        '1B': 1,
        '2B': 1,
        '3B': 1,
        SS: 1,
        CI: 0,
        MI: 0,
        OF: 3,
        DH: 0,
        SP: 5,
        RP: 2,
        UTIL: 0,
        BENCH: 0,
      },
      totalBudget: 260,
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.taken_players).toEqual([]);
    expect(body.teams).toEqual([
      ['team-1', 'Team 1', 260],
      ['team-2', 'Team 2', 260],
      ['team-3', 'Team 3', 260],
    ]);
  });

  it('recalculates current budgets from taken player prices', async () => {
    const existingLeague: League = {
      _id: 'league-1',
      externalId: 'custom-league-1',
      name: 'Budget League',
      totalBudget: 260,
      taken_players: [
        ['player-1', 'team-a', 'C-0', 25],
        ['player-2', 'team-a', '1B-0', 10],
        ['player-3', 'team-b', 'C-0', 40],
      ],
      teams: [
        ['team-a', 'Alpha', 0],
        ['team-b', 'Beta', 0],
      ],
    };

    await upsertLeague(
      {
        name: 'Budget League',
        teams: 2,
        draftType: 'auction',
        rosterSlots: {
          C: 1,
          '1B': 1,
          '2B': 1,
          '3B': 1,
          SS: 1,
          CI: 0,
          MI: 0,
          OF: 3,
          DH: 0,
          SP: 5,
          RP: 2,
          UTIL: 0,
          BENCH: 0,
        },
        totalBudget: 300,
      },
      existingLeague,
    );

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.taken_players).toEqual(existingLeague.taken_players);
    expect(body.teams).toEqual([
      ['team-a', 'Alpha', 265],
      ['team-b', 'Beta', 260],
    ]);
  });

  it('includes draftStateJson in the backend payload when provided', async () => {
    await upsertLeague({
      name: 'Budget League',
      teams: 2,
      draftType: 'auction',
      rosterSlots: {
        C: 1,
        '1B': 1,
        '2B': 1,
        '3B': 1,
        SS: 1,
        CI: 0,
        MI: 0,
        OF: 3,
        DH: 0,
        SP: 5,
        RP: 2,
        UTIL: 0,
        BENCH: 0,
      },
      totalBudget: 260,
      battingCategories: ['R'],
      pitchingCategories: ['K'],
      draftStateJson: {
        league: {
          leagueId: 'league-1',
          externalId: 'custom-league-1',
          name: 'Budget League',
          draftType: 'auction',
          totalBudget: 260,
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
            DH: 0,
            SP: 5,
            RP: 2,
            UTIL: 0,
            BENCH: 0,
          },
          minorLeagueSlotsPerTeam: 0,
          teamCount: 2,
        },
        teams: [],
        players: [],
        draftPicks: [],
      },
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.draftStateJson).toBeTruthy();
    expect(body.draftStateJson.league.name).toBe('Budget League');
  });

  it('can post draft saves through the dedicated draft-save endpoint', async () => {
    await upsertLeague(
      {
        name: 'Budget League',
        teams: 2,
        draftType: 'auction',
        rosterSlots: {
          C: 1,
          '1B': 1,
          '2B': 1,
          '3B': 1,
          SS: 1,
          CI: 0,
          MI: 0,
          OF: 3,
          DH: 0,
          SP: 5,
          RP: 2,
          UTIL: 0,
          BENCH: 0,
        },
        totalBudget: 260,
        battingCategories: ['R'],
        pitchingCategories: ['K'],
      },
      undefined,
      { endpoint: '/api/draft-save/leagues' },
    );

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/draft-save/leagues');
  });

  it('builds draftStateJson automatically when a caller does not provide it', async () => {
    const existingLeague: League = {
      _id: 'league-1',
      externalId: 'custom-league-1',
      name: 'Auto Json League',
      totalBudget: 260,
      battingCategories: ['R'],
      pitchingCategories: ['K'],
      draftType: 'auction',
      rosterSlots: {
        C: 1,
        '1B': 1,
        '2B': 1,
        '3B': 1,
        SS: 1,
        CI: 0,
        MI: 0,
        OF: 3,
        DH: 0,
        SP: 5,
        RP: 2,
        UTIL: 0,
        BENCH: 0,
      },
      taken_players: [['player-1', 'team-a', 'C-0', 25]],
      draft_picks: [[1, 'team-a', 'team-a', 'player-1', 25]],
      teams: [['team-a', 'Alpha', 0]],
      draftStateJson: {
        league: {
          leagueId: 'league-1',
          externalId: 'custom-league-1',
          name: 'Auto Json League',
          draftType: 'auction',
          totalBudget: 260,
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
            DH: 0,
            SP: 5,
            RP: 2,
            UTIL: 0,
            BENCH: 0,
          },
          minorLeagueSlotsPerTeam: 0,
          teamCount: 1,
        },
        teams: [],
        players: [
          {
            playerId: 'player-1',
            playerName: 'Adley Rutschman',
            playerTeam: 'BAL',
            positions: ['C'],
            playerType: 'hitter',
            draftedByTeamId: 'team-a',
            draftedByTeamName: 'Alpha',
            nominatedByTeamId: 'team-a',
            nominatedByTeamName: 'Alpha',
            slot: 'C-0',
            purchasePrice: 25,
            pickNumber: 1,
          },
        ],
        draftPicks: [],
      },
      format: 'roto',
      isDefault: false,
    };

    await upsertLeague(
      {
        name: 'Auto Json League',
        teams: 1,
        draftType: 'auction',
        rosterSlots: existingLeague.rosterSlots,
        totalBudget: 260,
        battingCategories: ['R'],
        pitchingCategories: ['K'],
        takenPlayers: [['player-1', 'team-a', 'C-0', 25]],
        draftPicks: [[1, 'team-a', 'team-a', 'player-1', 25]],
        teamsData: [['team-a', 'Alpha', 235]],
      },
      existingLeague,
    );

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.draftStateJson).toMatchObject({
      league: {
        externalId: 'custom-league-1',
        name: 'Auto Json League',
      },
      players: [
        expect.objectContaining({
          playerId: 'player-1',
          playerName: 'Adley Rutschman',
          purchasePrice: 25,
        }),
      ],
    });
  });

  it('merges the submitted draftStateJson into the response when the backend omits it', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { _id: 'league-1', name: 'League' },
      }),
    });

    const response = await upsertLeague({
      name: 'Budget League',
      teams: 2,
      draftType: 'auction',
      rosterSlots: {
        C: 1,
        '1B': 1,
        '2B': 1,
        '3B': 1,
        SS: 1,
        CI: 0,
        MI: 0,
        OF: 3,
        DH: 0,
        SP: 5,
        RP: 2,
        UTIL: 0,
        BENCH: 0,
      },
      totalBudget: 260,
      battingCategories: ['R'],
      pitchingCategories: ['K'],
      draftStateJson: {
        league: {
          leagueId: 'league-1',
          externalId: 'custom-league-1',
          name: 'Budget League',
          draftType: 'auction',
          totalBudget: 260,
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
            DH: 0,
            SP: 5,
            RP: 2,
            UTIL: 0,
            BENCH: 0,
          },
          minorLeagueSlotsPerTeam: 0,
          teamCount: 2,
        },
        teams: [],
        players: [],
        draftPicks: [],
      },
    });

    expect(response.data.draftStateJson).toBeTruthy();
    expect(response.data.draftStateJson?.league.name).toBe('Budget League');
  });
});
