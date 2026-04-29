const mockToast = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual =
    await vi.importActual<typeof import('@chakra-ui/react')>(
      '@chakra-ui/react',
    );
  return { ...actual, useToast: () => mockToast };
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DraftBoard from './DraftBoard';
import type {
  DraftPick,
  LeagueTeam,
  TakenPlayer,
} from '@/features/Leagues/types/leagues.types';

const fetchMock = vi.fn();

const TEAMS: LeagueTeam[] = [
  ['team-1', 'Alpha', 260],
  ['team-2', 'Beta', 260],
];

const STARTING_BUDGET = 260;

async function renderDraftBoard(
  props: {
    takenPlayers?: TakenPlayer[];
    draftPicks?: DraftPick[];
    startingBudget?: number;
    onPickEntered?: (pick: DraftPick, takenEntry: TakenPlayer) => void;
  } = {},
) {
  render(
    <ChakraProvider>
      <DraftBoard
        teams={TEAMS}
        startingBudget={STARTING_BUDGET}
        takenPlayers={[]}
        draftPicks={[]}
        {...props}
      />
    </ChakraProvider>,
  );

  // Wait for players to finish loading (placeholder changes once loaded)
  await screen.findByPlaceholderText('Search player...', undefined, {
    timeout: 3000,
  });
  await waitFor(
    () => {
      expect(
        document.querySelectorAll('datalist option').length,
      ).toBeGreaterThan(0);
    },
    { timeout: 3000 },
  );
}

describe('DraftBoard', () => {
  beforeEach(() => {
    mockToast.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: [
          {
            _id: 'player-adley',
            name: 'Adley Rutschman',
            team: 'BAL',
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-freddie',
            name: 'Freddie Freeman',
            team: 'LAD',
            positions: ['1B'],
            playerType: 'hitter',
          },
        ],
        pagination: { totalPages: 1 },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows error toast when Enter Pick is clicked with any field missing', async () => {
    await renderDraftBoard();

    // Only fill nominating team — leave player, winning team, and salary empty
    const [nominatingSelect] = screen.getAllByRole('combobox');
    fireEvent.change(nominatingSelect, { target: { value: 'team-1' } });

    fireEvent.click(screen.getByRole('button', { name: /enter pick/i }));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'All fields are required.',
        status: 'error',
      }),
    );
  });

  it('shows error toast when the winning team cannot afford the salary', async () => {
    // team-1 has spent $250, leaving only $10
    const takenPlayers: TakenPlayer[] = [['player-x', 'team-1', 'C-0', 250]];
    await renderDraftBoard({ takenPlayers });

    const [nominatingSelect, winningSelect] = screen
      .getAllByRole('combobox')
      .filter((el): el is HTMLSelectElement => el instanceof HTMLSelectElement);
    fireEvent.change(nominatingSelect, { target: { value: 'team-2' } });
    fireEvent.change(screen.getByPlaceholderText('Search player...'), {
      target: { value: 'Adley Rutschman' },
    });
    fireEvent.change(winningSelect, { target: { value: 'team-1' } });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '50' },
    });

    fireEvent.click(screen.getByRole('button', { name: /enter pick/i }));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Team cannot afford this pick.',
        status: 'error',
      }),
    );
  });

  it('calls onPickEntered with the correct DraftPick and TakenPlayer for a valid pick', async () => {
    const onPickEntered = vi.fn();
    await renderDraftBoard({ onPickEntered });

    const [nominatingSelect, winningSelect] = screen
      .getAllByRole('combobox')
      .filter((el): el is HTMLSelectElement => el instanceof HTMLSelectElement);
    fireEvent.change(nominatingSelect, { target: { value: 'team-1' } });
    fireEvent.change(screen.getByPlaceholderText('Search player...'), {
      target: { value: 'Adley Rutschman' },
    });
    fireEvent.change(winningSelect, { target: { value: 'team-2' } });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '30' },
    });

    fireEvent.click(screen.getByRole('button', { name: /enter pick/i }));

    expect(onPickEntered).toHaveBeenCalledWith(
      [1, 'team-1', 'team-2', 'player-adley', 30],
      ['player-adley', 'team-2', 'DRAFT', 30],
    );
  });

  it('uses existing draft picks length to determine the next pick number', async () => {
    const onPickEntered = vi.fn();
    const existingPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-freddie', 40],
    ];
    await renderDraftBoard({ onPickEntered, draftPicks: existingPicks });

    const [nominatingSelect, winningSelect] = screen
      .getAllByRole('combobox')
      .filter((el): el is HTMLSelectElement => el instanceof HTMLSelectElement);
    fireEvent.change(nominatingSelect, { target: { value: 'team-2' } });
    fireEvent.change(screen.getByPlaceholderText('Search player...'), {
      target: { value: 'Adley Rutschman' },
    });
    fireEvent.change(winningSelect, { target: { value: 'team-1' } });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '25' },
    });

    fireEvent.click(screen.getByRole('button', { name: /enter pick/i }));

    expect(onPickEntered).toHaveBeenCalledWith(
      [2, 'team-2', 'team-1', 'player-adley', 25],
      expect.anything(),
    );
  });

  it('Undo button is disabled when there are no draft picks', async () => {
    await renderDraftBoard({ draftPicks: [] });
    expect(
      (screen.getByRole('button', { name: /undo/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('Undo button is enabled and calls onUndo when picks exist', async () => {
    const onUndo = vi.fn();
    const existingPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
    ];
    await renderDraftBoard({ draftPicks: existingPicks, onUndo });

    const undoButton = screen.getByRole('button', {
      name: /undo/i,
    }) as HTMLButtonElement;
    expect(undoButton.disabled).toBe(false);
    fireEvent.click(undoButton);
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('renders a pre-existing draft pick row with correct pick number, teams, player, and salary', async () => {
    const existingPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
    ];
    await renderDraftBoard({ draftPicks: existingPicks });

    // Scope assertions to table rows to avoid collisions with dropdown <option> elements
    const rows = screen.getAllByRole('row');
    // rows[0] = header, rows[1] = pick row, rows[2] = input row
    const pickRow = rows[1];
    expect(within(pickRow).getByText('1')).toBeTruthy();
    expect(within(pickRow).getByText('Alpha')).toBeTruthy();
    expect(within(pickRow).getByText('A. Rutschman')).toBeTruthy();
    expect(within(pickRow).getByText('Beta')).toBeTruthy();
    expect(within(pickRow).getByText('$30')).toBeTruthy();
  });

  it('renders all pre-existing pick rows when multiple picks are stored', async () => {
    const existingPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
      [2, 'team-2', 'team-1', 'player-freddie', 45],
    ];
    await renderDraftBoard({ draftPicks: existingPicks });

    const rows = screen.getAllByRole('row');
    // rows[0] = header, rows[1] = first pick, rows[2] = second pick, rows[3] = input row
    const firstPickRow = rows[1];
    expect(within(firstPickRow).getByText('1')).toBeTruthy();
    expect(within(firstPickRow).getByText('A. Rutschman')).toBeTruthy();
    expect(within(firstPickRow).getByText('$30')).toBeTruthy();

    const secondPickRow = rows[2];
    expect(within(secondPickRow).getByText('2')).toBeTruthy();
    expect(within(secondPickRow).getByText('F. Freeman')).toBeTruthy();
    expect(within(secondPickRow).getByText('$45')).toBeTruthy();
  });

  it('clears all input fields after a valid pick is entered', async () => {
    const onPickEntered = vi.fn();
    await renderDraftBoard({ onPickEntered });

    const [nominatingSelect, winningSelect] = screen
      .getAllByRole('combobox')
      .filter((el): el is HTMLSelectElement => el instanceof HTMLSelectElement);
    fireEvent.change(nominatingSelect, { target: { value: 'team-1' } });
    fireEvent.change(screen.getByPlaceholderText('Search player...'), {
      target: { value: 'Adley Rutschman' },
    });
    fireEvent.change(winningSelect, { target: { value: 'team-2' } });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '30' },
    });

    fireEvent.click(screen.getByRole('button', { name: /enter pick/i }));

    const [nomSelect, winSelect] = screen.getAllByRole('combobox');
    expect((nomSelect as HTMLSelectElement).value).toBe('');
    expect((winSelect as HTMLSelectElement).value).toBe('');
    expect(
      (screen.getByPlaceholderText('Search player...') as HTMLInputElement)
        .value,
    ).toBe('');
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('');
  });
});
