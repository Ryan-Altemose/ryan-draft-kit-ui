import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('UpsertLeagueModal', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
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
    expect(args.input.draftType).toBe('auction');
    expect(args.input.totalBudget).toBe(300);
    expect(args.input.taxiSquadPlayersPerTeam).toBe(2);
  });
});
