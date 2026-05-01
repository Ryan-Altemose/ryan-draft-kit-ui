import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState, useEffect } from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { ERROR_MESSAGES } from '@/shared/constants';
import { ApiError } from '@/shared/utils/api-client';
import LeagueDetailPage from './leagueDetailPage';
import type { League, LeagueTeam } from './types/leagues.types';

const pushMock = vi.fn();
const replaceMock = vi.fn();
const deleteMutateAsyncMock = vi.fn();
const upsertMutateAsyncMock = vi.fn();
let mockLeague: League;
let mockError: Error | null = null;
let mockIsLoading = false;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./hooks/useLeague', () => ({
  useLeague: () => ({
    isLoading: mockIsLoading,
    error: mockError,
    data: {
      data: mockLeague,
    },
  }),
}));

vi.mock('./hooks/useDeleteLeague', () => ({
  useDeleteLeague: () => ({
    mutateAsync: deleteMutateAsyncMock,
    isPending: false,
    isError: false,
  }),
}));

vi.mock('./hooks/useUpsertLeague', () => ({
  useUpsertLeague: () => ({
    mutateAsync: upsertMutateAsyncMock,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
}));

vi.mock('./components/UpsertLeagueModal', () => ({
  default: () => null,
}));

vi.mock('./components/LeagueTeamTable', () => ({
  default: ({
    team,
    rosterSlots = {},
    takenPlayers = [],
    startingBudget,
    onSaveChanges,
  }: {
    team: LeagueTeam;
    rosterSlots?: Record<string, number>;
    takenPlayers?: Array<[string, string, string, number]>;
    startingBudget: number;
    onSaveChanges?: (payload: {
      teamName: string;
      rows: Array<{ rowId: string; playerId: string; price: number }>;
    }) => void;
  }) => {
    const [localTeamName, setLocalTeamName] = useState(team[1]);
    const buildRows = () =>
      takenPlayers.length > 0
        ? takenPlayers
            .filter((player) => {
              const position = player[2].split('-')[0];
              return rosterSlots[position] > 0;
            })
            .map((player) => ({
              rowId: player[2],
              playerId: player[0],
              price: player[3],
            }))
        : [{ rowId: 'C-0', playerId: '', price: 0 }];

    const [rows, setRows] = useState(buildRows);
    const currentBudget =
      startingBudget - rows.reduce((sum, row) => sum + row.price, 0);

    useEffect(() => {
      setRows(buildRows());
    }, [takenPlayers, rosterSlots]);

    const handlePriceChange = (index: number, value: string) => {
      const price = Number.isNaN(Number(value)) ? 0 : Number(value);
      setRows((prev) =>
        prev.map((row, rowIndex) =>
          rowIndex === index ? { ...row, price } : row,
        ),
      );
    };

    const handleSave = () => {
      const invalidRows = rows.filter(
        (row) =>
          (row.playerId && row.price <= 0) || (!row.playerId && row.price > 0),
      );

      if (invalidRows.length > 0) {
        return;
      }

      onSaveChanges?.({ teamName: localTeamName, rows });
    };

    return (
      <div>
        <input
          value={localTeamName}
          onChange={(event) => setLocalTeamName(event.target.value)}
        />
        <p>Budget: ${currentBudget}</p>
        {rows.map((row, index) => (
          <div key={row.rowId}>
            <span>{row.playerId}</span>
            <input
              type="number"
              value={String(row.price)}
              onChange={(event) => handlePriceChange(index, event.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    );
  },
}));

describe('LeagueDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError = null;
    mockIsLoading = false;
    upsertMutateAsyncMock.mockResolvedValue({});
    mockLeague = {
      _id: 'league-123',
      externalId: 'custom-league-123',
      name: 'My League',
      teams: [
        ['team-1', 'Alpha', 240],
        ['team-2', 'Beta', 215],
      ],
      taken_players: [
        ['player-1', 'team-1', 'C-0', 20],
        ['player-2', 'team-2', 'C-0', 45],
      ],
      totalBudget: 260,
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
    };
  });

  it('shows an access denied message for 403 responses', () => {
    mockError = new ApiError(ERROR_MESSAGES.FORBIDDEN, 403);

    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-123" />
      </ChakraProvider>,
    );

    expect(screen.getByText(ERROR_MESSAGES.FORBIDDEN)).toBeTruthy();
  });

  it('redirects away from dead detail pages on 404 responses', async () => {
    mockError = new ApiError(ERROR_MESSAGES.NOT_FOUND, 404);

    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-123" />
      </ChakraProvider>,
    );

    expect(screen.getByText(ERROR_MESSAGES.NOT_FOUND)).toBeTruthy();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/leagues');
    });
  });

  it('confirms and deletes a league, then navigates back to leagues list', async () => {
    deleteMutateAsyncMock.mockResolvedValue({});

    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-123" />
      </ChakraProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = await screen.findByRole('alertdialog');
    const dialogScope = within(dialog);

    fireEvent.click(dialogScope.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteMutateAsyncMock).toHaveBeenCalledWith('league-123');
      expect(pushMock).toHaveBeenCalledWith('/leagues');
    });
  });

  it('renders the team table component for each league team', async () => {
    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-123" />
      </ChakraProvider>,
    );

    expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
    expect(screen.getByDisplayValue('Beta')).toBeTruthy();
    expect(screen.getByText('Budget: $240')).toBeTruthy();
    expect(screen.getByText('Budget: $215')).toBeTruthy();
    expect(screen.getByText('player-1')).toBeTruthy();
    expect(screen.getByText('player-2')).toBeTruthy();
  });

  it('renders placeholder team tables up to the league team count', () => {
    mockLeague = {
      _id: 'league-456',
      externalId: 'custom-league-456',
      name: 'Fallback League',
      description: '3 teams',
      totalBudget: 260,
      draftType: 'auction',
      rosterSlots: {
        C: 1,
        '1B': 0,
        '2B': 0,
        '3B': 0,
        SS: 0,
        CI: 0,
        MI: 0,
        OF: 0,
        DH: 0,
        SP: 0,
        RP: 0,
        UTIL: 0,
        BENCH: 0,
      },
    };

    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-456" />
      </ChakraProvider>,
    );

    expect(screen.getByDisplayValue('Team 1')).toBeTruthy();
    expect(screen.getByDisplayValue('Team 2')).toBeTruthy();
    expect(screen.getByDisplayValue('Team 3')).toBeTruthy();
  });

  it('saves edited prices back to the league object from a team table save button', async () => {
    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-123" />
      </ChakraProvider>,
    );

    const priceInputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    fireEvent.change(priceInputs[0], { target: { value: '30' } });
    fireEvent.change(screen.getByDisplayValue('Alpha'), {
      target: { value: 'Gamma' },
    });
    fireEvent.click(
      screen.getAllByRole('button', { name: /save changes/i })[0],
    );

    await waitFor(() => {
      expect(upsertMutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    const args = upsertMutateAsyncMock.mock.calls[0][0];
    expect(args.input.teamsData).toEqual([
      ['team-1', 'Gamma', 240],
      ['team-2', 'Beta', 215],
    ]);
    expect(args.input.takenPlayers).toEqual([
      ['player-1', 'team-1', 'C-0', 30],
      ['player-2', 'team-2', 'C-0', 45],
    ]);
  });

  it('persists a non-zero edited price for a slot with no existing taken player', async () => {
    mockLeague = {
      _id: 'league-999',
      externalId: 'custom-league-999',
      name: 'Empty Team League',
      teams: [['team-1', 'Alpha', 260]],
      taken_players: [],
      totalBudget: 260,
      draftType: 'auction',
      rosterSlots: {
        C: 1,
        '1B': 0,
        '2B': 0,
        '3B': 0,
        SS: 0,
        CI: 0,
        MI: 0,
        OF: 0,
        DH: 0,
        SP: 0,
        RP: 0,
        UTIL: 0,
        BENCH: 0,
      },
    };

    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-999" />
      </ChakraProvider>,
    );

    const priceInput = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(priceInput, { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(upsertMutateAsyncMock).not.toHaveBeenCalled();
  });

  it('keeps an edited price attached to its original slot after roster changes', async () => {
    mockLeague = {
      _id: 'league-777',
      externalId: 'custom-league-777',
      name: 'Shifted League',
      teams: [['team-1', 'Alpha', 203]],
      taken_players: [
        ['Catcher Player', 'team-1', 'C-0', 100],
        ['First Base Player', 'team-1', '1B-0', 35],
        ['Outfielder', 'team-1', 'OF-0', 22],
      ],
      totalBudget: 260,
      draftType: 'auction',
      rosterSlots: {
        C: 0,
        '1B': 1,
        '2B': 0,
        '3B': 0,
        SS: 0,
        CI: 0,
        MI: 0,
        OF: 1,
        DH: 0,
        SP: 0,
        RP: 0,
        UTIL: 0,
        BENCH: 0,
      },
    };

    render(
      <ChakraProvider>
        <LeagueDetailPage leagueId="league-777" />
      </ChakraProvider>,
    );

    expect(screen.getByText('First Base Player')).toBeTruthy();
    expect(screen.getByText('Outfielder')).toBeTruthy();
    expect(screen.getByDisplayValue('35')).toBeTruthy();
    expect(screen.getByDisplayValue('22')).toBeTruthy();
    expect(screen.queryByDisplayValue('100')).toBeNull();
  });
});
