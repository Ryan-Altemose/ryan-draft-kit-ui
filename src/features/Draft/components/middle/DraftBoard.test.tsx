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

const ROSTER_SLOTS = {
  C: 1,
  '1B': 1,
  '2B': 1,
  '3B': 1,
  SS: 1,
  CI: 0,
  MI: 0,
  OF: 3,
  SP: 2,
  RP: 2,
  UTIL: 0,
  BENCH: 0,
};

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
        rosterSlots={ROSTER_SLOTS}
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
          {
            _id: 'player-trout',
            name: 'Mike Trout',
            team: 'LAA',
            positions: ['OF'],
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
      ['player-adley', 'team-2', 'C-0', 30, [1, 'team-1', 'team-2']],
    );
  });

  it('uses existing draft picks length to determine the next pick number', async () => {
    const onPickEntered = vi.fn();
    const takenPlayers: TakenPlayer[] = [
      ['player-freddie', 'team-2', '1B-0', 40, [1, 'team-1', 'team-2']],
    ];
    const draftPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-freddie', 40],
    ];
    await renderDraftBoard({ onPickEntered, takenPlayers, draftPicks });

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
    const takenPlayers: TakenPlayer[] = [
      ['player-adley', 'team-2', 'C-0', 30, [1, 'team-1', 'team-2']],
    ];
    const draftPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
    ];
    await renderDraftBoard({ takenPlayers, draftPicks, onUndo });

    const undoButton = screen.getByRole('button', {
      name: /undo/i,
    }) as HTMLButtonElement;
    expect(undoButton.disabled).toBe(false);
    fireEvent.click(undoButton);
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('renders a pre-existing draft pick row with correct pick number, teams, player, and salary', async () => {
    const takenPlayers: TakenPlayer[] = [
      ['player-adley', 'team-2', 'C-0', 30, [1, 'team-1', 'team-2']],
    ];
    const draftPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
    ];
    await renderDraftBoard({ takenPlayers, draftPicks });

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
    const takenPlayers: TakenPlayer[] = [
      ['player-adley', 'team-2', 'C-0', 30, [1, 'team-1', 'team-2']],
      ['player-freddie', 'team-1', '1B-0', 45, [2, 'team-2', 'team-1']],
    ];
    const draftPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
      [2, 'team-2', 'team-1', 'player-freddie', 45],
    ];
    await renderDraftBoard({ takenPlayers, draftPicks });

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

  it('shows draft picks from draftPicks prop even when takenPlayers have no pick metadata', async () => {
    const takenPlayers: TakenPlayer[] = [
      ['player-adley', 'team-2', 'C-0', 30], // 4-tuple — no pick metadata
    ];
    const draftPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
    ];
    await renderDraftBoard({ takenPlayers, draftPicks });

    const rows = screen.getAllByRole('row');
    // header + 1 pick row + input row + footer row = 4
    expect(rows.length).toBe(4);
    const pickRow = rows[1];
    expect(within(pickRow).getByText('1')).toBeTruthy();
    expect(within(pickRow).getByText('A. Rutschman')).toBeTruthy();
    expect(within(pickRow).getByText('$30')).toBeTruthy();
  });

  it('shows original draft pick data on the board even after the player has been traded to a different team', async () => {
    // Adley was originally won by team-2 but has since been traded to team-1
    const takenPlayers: TakenPlayer[] = [
      ['player-adley', 'team-1', 'C-0', 30, [1, 'team-1', 'team-2']],
    ];
    const draftPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
    ];
    await renderDraftBoard({ takenPlayers, draftPicks });

    const rows = screen.getAllByRole('row');
    const pickRow = rows[1];
    // Board reads from draftPicks — winning team is still Beta (team-2)
    expect(within(pickRow).getByText('Beta')).toBeTruthy();
    expect(within(pickRow).getByText('A. Rutschman')).toBeTruthy();
  });

  it('removes the last pick row when draftPicks prop shrinks after undo', async () => {
    const takenPlayers: TakenPlayer[] = [
      ['player-adley', 'team-2', 'C-0', 30, [1, 'team-1', 'team-2']],
      ['player-freddie', 'team-1', '1B-0', 45, [2, 'team-2', 'team-1']],
    ];
    const draftPicks: DraftPick[] = [
      [1, 'team-1', 'team-2', 'player-adley', 30],
      [2, 'team-2', 'team-1', 'player-freddie', 45],
    ];

    const { rerender } = render(
      <ChakraProvider>
        <DraftBoard
          teams={TEAMS}
          startingBudget={STARTING_BUDGET}
          takenPlayers={takenPlayers}
          draftPicks={draftPicks}
          rosterSlots={ROSTER_SLOTS}
        />
      </ChakraProvider>,
    );

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

    // header + 2 pick rows + input row + footer row = 5
    expect(screen.getAllByRole('row').length).toBe(5);

    rerender(
      <ChakraProvider>
        <DraftBoard
          teams={TEAMS}
          startingBudget={STARTING_BUDGET}
          takenPlayers={[takenPlayers[0]]}
          draftPicks={[[1, 'team-1', 'team-2', 'player-adley', 30]]}
          rosterSlots={ROSTER_SLOTS}
        />
      </ChakraProvider>,
    );

    await waitFor(() => {
      // header + 1 pick row + input row + footer row = 4
      expect(screen.getAllByRole('row').length).toBe(4);
    });
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
