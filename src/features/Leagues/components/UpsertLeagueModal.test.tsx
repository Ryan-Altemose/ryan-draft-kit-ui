import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import UpsertLeagueModal from './UpsertLeagueModal';
import type { League } from '../types/leagues.types';

const mutateAsyncMock = vi.fn();

vi.mock('../hooks/useUpsertLeague', () => ({
  useUpsertLeague: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
}));

function renderModal(initialLeague?: League) {
  render(
    <ChakraProvider>
      <UpsertLeagueModal
        isOpen={true}
        onClose={vi.fn()}
        initialLeague={initialLeague}
      />
    </ChakraProvider>,
  );
}

const BASE_ROSTER_SLOTS = {
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
  P: 0,
  UTIL: 0,
  BENCH: 0,
};

function makeLeague(overrides: Partial<League> = {}): League {
  return {
    _id: 'league-1',
    externalId: 'custom-league-1',
    name: 'Test League',
    totalBudget: 260,
    description: '3 teams',
    format: 'roto',
    draftType: 'auction',
    taken_players: [],
    teams: [
      ['team-1', 'Team 1', 260],
      ['team-2', 'Team 2', 260],
      ['team-3', 'Team 3', 260],
    ],
    battingCategories: ['R', 'HR', 'RBI', 'SB', 'AVG'],
    pitchingCategories: ['W', 'SV', 'K', 'ERA', 'WHIP'],
    rosterSlots: { ...BASE_ROSTER_SLOTS },
    ...overrides,
  };
}

describe('UpsertLeagueModal', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits update with existing league context', async () => {
    mutateAsyncMock.mockResolvedValue({});

    const initialLeague: League = {
      _id: 'league-123',
      externalId: 'custom-league-123',
      name: 'Old Name',
      totalBudget: 275,
      description: '10 teams',
      format: 'roto',
      draftType: 'auction',
      taken_players: [],
      teams: [
        ['team-1', 'Team 1', 275],
        ['team-2', 'Team 2', 275],
        ['team-3', 'Team 3', 275],
        ['team-4', 'Team 4', 275],
        ['team-5', 'Team 5', 275],
        ['team-6', 'Team 6', 275],
        ['team-7', 'Team 7', 275],
        ['team-8', 'Team 8', 275],
        ['team-9', 'Team 9', 275],
        ['team-10', 'Team 10', 275],
      ],
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
        DH: 0,
        SP: 5,
        RP: 2,
        UTIL: 0,
        BENCH: 0,
      },
    };

    renderModal(initialLeague);

    expect(screen.getByRole('dialog', { name: /edit league/i })).toBeTruthy();

    const nameInput = screen.getByLabelText(/league name/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(
      (screen.getByLabelText(/starting budget/i) as HTMLInputElement).value,
    ).toBe('275');
    fireEvent.change(screen.getByLabelText(/starting budget/i), {
      target: { value: '300' },
    });

    fireEvent.change(screen.getByLabelText(/taxi squad players per team/i), {
      target: { value: '2' },
    });

    const saveButton = screen.getByRole('button', {
      name: /save changes/i,
    }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);
    fireEvent.click(saveButton);

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    const args = mutateAsyncMock.mock.calls[0][0];
    expect(args.existingLeague).toEqual(initialLeague);
    expect(args.input.name).toBe('New Name');
    expect(args.input.teams).toBe(10);
    expect(args.input.totalBudget).toBe(300);
    expect(args.input.taxiSquadPlayersPerTeam).toBe(2);
  });

  it('saves immediately without a confirmation dialog when no taken players would be orphaned', () => {
    mutateAsyncMock.mockResolvedValue({});
    renderModal(makeLeague({ taken_players: [] }));

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('shows a confirmation dialog when reducing team count would orphan a drafted player', async () => {
    renderModal(
      makeLeague({
        taken_players: [['player-drop', 'team-3', 'C-0', 20]],
      }),
    );

    // Reduce from 3 teams to 2 — team-3's player becomes orphaned
    fireEvent.change(screen.getByLabelText(/of teams/i), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText('1')).toBeTruthy();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('does not call mutateAsync when the confirmation dialog is cancelled', async () => {
    renderModal(
      makeLeague({
        taken_players: [['player-drop', 'team-3', 'C-0', 20]],
      }),
    );

    fireEvent.change(screen.getByLabelText(/of teams/i), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

    expect(mutateAsyncMock).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('calls mutateAsync with orphaned players removed when the confirmation is accepted after team reduction', async () => {
    mutateAsyncMock.mockResolvedValue({});

    renderModal(
      makeLeague({
        taken_players: [
          ['player-keep', 'team-1', 'C-0', 30],
          ['player-drop', 'team-3', 'C-0', 20],
        ],
      }),
    );

    fireEvent.change(screen.getByLabelText(/of teams/i), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: /save & remove/i }),
    );

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));

    const { input } = mutateAsyncMock.mock.calls[0][0];
    expect(input.takenPlayers).toEqual([['player-keep', 'team-1', 'C-0', 30]]);
    expect(input.takenPlayers).not.toContainEqual([
      'player-drop',
      'team-3',
      'C-0',
      20,
    ]);
  });

  it('shows a confirmation dialog when reducing a position slot count orphans a drafted player', async () => {
    renderModal(
      makeLeague({
        rosterSlots: { ...BASE_ROSTER_SLOTS, C: 2 },
        taken_players: [['player-slot', 'team-1', 'C-1', 25]],
      }),
    );

    // Reduce C slots from 2 → 1; player at C-1 becomes orphaned
    fireEvent.change(screen.getByLabelText('C'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeTruthy();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('preserves players with unrecognized slot formats and only removes truly orphaned entries', async () => {
    mutateAsyncMock.mockResolvedValue({});

    // player-sentinel has an 'UNSLOTTED' slot (sentinel value) on a valid team — must be preserved
    // player-drop is on team-3, which will be removed
    renderModal(
      makeLeague({
        taken_players: [
          ['player-sentinel', 'team-1', 'UNSLOTTED', 10],
          ['player-drop', 'team-3', 'C-0', 20],
        ],
      }),
    );

    fireEvent.change(screen.getByLabelText(/of teams/i), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const dialog = await screen.findByRole('alertdialog');
    // Only 1 player orphaned (player-drop); player-sentinel's slot is not a known format
    expect(within(dialog).getByText('1')).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole('button', { name: /save & remove/i }),
    );

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));

    const { input } = mutateAsyncMock.mock.calls[0][0];
    expect(input.takenPlayers).toContainEqual([
      'player-sentinel',
      'team-1',
      'UNSLOTTED',
      10,
    ]);
    expect(input.takenPlayers).not.toContainEqual([
      'player-drop',
      'team-3',
      'C-0',
      20,
    ]);
  });

  it('shows a confirmation dialog when reducing taxi squad slot count orphans a drafted player', async () => {
    renderModal(
      makeLeague({
        taxiSquadPlayersPerTeam: 2,
        taken_players: [['player-taxi', 'team-1', 'TAXI-1', 15]],
      }),
    );

    // Reduce taxi squad from 2 → 1; player at TAXI-1 becomes orphaned
    fireEvent.change(screen.getByLabelText(/taxi squad players per team/i), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeTruthy();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('calls mutateAsync with orphaned taxi squad player removed when confirmed', async () => {
    mutateAsyncMock.mockResolvedValue({});

    renderModal(
      makeLeague({
        taxiSquadPlayersPerTeam: 2,
        taken_players: [
          ['player-keep', 'team-1', 'TAXI-0', 10],
          ['player-drop', 'team-1', 'TAXI-1', 15],
        ],
      }),
    );

    fireEvent.change(screen.getByLabelText(/taxi squad players per team/i), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: /save & remove/i }),
    );

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));

    const { input } = mutateAsyncMock.mock.calls[0][0];
    expect(input.takenPlayers).toContainEqual([
      'player-keep',
      'team-1',
      'TAXI-0',
      10,
    ]);
    expect(input.takenPlayers).not.toContainEqual([
      'player-drop',
      'team-1',
      'TAXI-1',
      15,
    ]);
  });
});
