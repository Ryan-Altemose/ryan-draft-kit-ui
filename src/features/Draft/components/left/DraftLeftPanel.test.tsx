import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DraftLeftPanel from './DraftLeftPanel';
import type { League } from '@/features/Leagues/types/leagues.types';

const mockLeagues: League[] = [
  {
    _id: 'league-1',
    externalId: 'ext-1',
    name: 'Alpha League',
    format: 'roto',
    draftType: 'auction',
    totalBudget: 260,
    battingCategories: ['R', 'HR', 'RBI', 'SB', 'AVG'],
    pitchingCategories: ['W', 'SV', 'K', 'ERA', 'WHIP'],
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
    teams: [
      ['team-1', 'Team A', 260],
      ['team-2', 'Team B', 260],
      ['team-3', 'Team C', 260],
    ],
    isDefault: false,
  },
  {
    _id: 'league-2',
    externalId: 'ext-2',
    name: 'Beta League',
    format: 'h2h-category',
    draftType: 'auction',
    totalBudget: 300,
    battingCategories: ['HR', 'AVG', 'OBP'],
    pitchingCategories: ['ERA', 'WHIP', 'K'],
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
    teams: [['team-4', 'Team D', 300]],
    isDefault: false,
  },
];

vi.mock('@/features/Leagues/hooks/useLeagues', () => ({
  useLeagues: vi.fn(),
}));

vi.mock('@/features/Leagues/hooks/useLeague', () => ({
  useLeague: vi.fn(),
}));

import { useLeagues } from '@/features/Leagues/hooks/useLeagues';
import { useLeague } from '@/features/Leagues/hooks/useLeague';

function renderPanel() {
  render(
    <ChakraProvider>
      <DraftLeftPanel onLeagueChange={vi.fn()} />
    </ChakraProvider>,
  );
}

describe('DraftLeftPanel', () => {
  beforeEach(() => {
    vi.mocked(useLeagues).mockReturnValue({
      data: {
        success: true,
        data: mockLeagues,
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
    } as ReturnType<typeof useLeagues>);

    vi.mocked(useLeague).mockImplementation(
      (leagueId?: string) =>
        ({
          data: leagueId
            ? {
                success: true,
                data: mockLeagues.find(
                  (league) => league._id === leagueId,
                ) as League,
              }
            : undefined,
        }) as ReturnType<typeof useLeague>,
    );
  });

  it('renders the league dropdown with all leagues', () => {
    renderPanel();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(screen.getByText('Alpha League')).toBeTruthy();
    expect(screen.getByText('Beta League')).toBeTruthy();
  });

  it('shows empty league info before a league is selected', () => {
    renderPanel();

    expect(screen.getByText(/select a league to view details/i)).toBeTruthy();
  });

  it('shows a spinner while leagues are loading', () => {
    vi.mocked(useLeagues).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useLeagues>);

    renderPanel();

    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('displays league details after selecting a league', () => {
    renderPanel();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'league-1' },
    });

    // Name appears in both the dropdown option and the info panel
    expect(screen.getAllByText('Alpha League').length).toBeGreaterThanOrEqual(
      2,
    );
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('$260')).toBeTruthy();
  });

  it('displays hitting and pitching categories for the selected league', () => {
    renderPanel();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'league-1' },
    });

    for (const cat of ['R', 'HR', 'RBI', 'SB', 'AVG']) {
      expect(screen.getAllByText(cat).length).toBeGreaterThan(0);
    }
    for (const cat of ['W', 'SV', 'K', 'ERA', 'WHIP']) {
      expect(screen.getAllByText(cat).length).toBeGreaterThan(0);
    }
  });

  it('updates league details when a different league is selected', () => {
    renderPanel();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'league-1' },
    });
    expect(screen.getByText('$260')).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'league-2' },
    });
    // Name appears in both the dropdown option and the info panel
    expect(screen.getAllByText('Beta League').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('$300')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('returns to empty state when placeholder option is selected', () => {
    renderPanel();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'league-1' },
    });
    // Info panel shows the league name (in addition to the dropdown option)
    expect(screen.getAllByText('Alpha League').length).toBeGreaterThanOrEqual(
      2,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(screen.getByText(/select a league to view details/i)).toBeTruthy();
  });
});
