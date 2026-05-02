vi.mock('@chakra-ui/react', async () => {
  const actual =
    await vi.importActual<typeof import('@chakra-ui/react')>(
      '@chakra-ui/react',
    );
  return {
    ...actual,
    useToast: () => vi.fn(),
  };
});

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import LeagueTeamTable from './LeagueTeamTable';

const fetchMock = vi.fn();

async function renderLeagueTeamTable(element: JSX.Element) {
  render(element);
  // Tables start collapsed — click the header to expand before asserting content
  const header = await screen.findByText(/Budget:/);
  fireEvent.click(header);
  await screen.findAllByPlaceholderText('Search players...', undefined, {
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

describe('LeagueTeamTable', () => {
  beforeEach(() => {
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
            _id: 'player-julio',
            name: 'Julio Rodriguez',
            team: 'SEA',
            positions: ['OF'],
            playerType: 'hitter',
          },
          {
            _id: 'player-william',
            name: 'William Contreras',
            team: 'MIL',
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-a',
            name: 'Player A',
            team: 'BOS',
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-b',
            name: 'Player B',
            team: 'NYY',
            positions: ['1B'],
            playerType: 'hitter',
          },
          {
            _id: 'player-catcher',
            name: 'Catcher Player',
            team: 'ATL',
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-firstbase',
            name: 'First Base Player',
            team: 'TEX',
            positions: ['1B'],
            playerType: 'hitter',
          },
          {
            _id: 'player-outfielder',
            name: 'Outfielder',
            team: 'CIN',
            positions: ['OF'],
            playerType: 'hitter',
          },
          {
            _id: 'player-sp',
            name: 'Mock Player SP',
            team: 'BOS',
            positions: ['SP'],
            playerType: 'pitcher',
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
  it('renders the team name, calculated budget, and rows from roster slots', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 999]}
          startingBudget={260}
          rosterSlots={{
            C: 1,
            '1B': 1,
            '2B': 0,
            '3B': 0,
            SS: 0,
            CI: 0,
            MI: 0,
            OF: 2,
            DH: 0,
            SP: 0,
            RP: 0,
            UTIL: 0,
            BENCH: 0,
          }}
          takenPlayers={[
            ['player-adley', 'team-1', 'C-0', 20],
            ['player-freddie', 'team-1', '1B-0', 35],
            ['player-julio', 'team-1', 'OF-0', 40],
          ]}
        />
      </ChakraProvider>,
    );

    expect(screen.getByDisplayValue('Alpha')).toBeTruthy();
    expect(screen.getByText('Budget: $165')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.getByText('1B')).toBeTruthy();
    expect(screen.getAllByText('OF')).toHaveLength(2);
    await waitFor(() =>
      expect(screen.getByDisplayValue('A. Rutschman')).toBeTruthy(),
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue('F. Freeman')).toBeTruthy(),
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue('J. Rodriguez')).toBeTruthy(),
    );
    expect(screen.getByText('BAL')).toBeTruthy();
    expect(screen.getByText('LAD')).toBeTruthy();
    expect(screen.getByText('SEA')).toBeTruthy();
    expect(screen.getByDisplayValue('20')).toBeTruthy();
    expect(screen.getByDisplayValue('35')).toBeTruthy();
    expect(screen.getByDisplayValue('40')).toBeTruthy();
  });

  it('shows empty rows when there are fewer players than roster slots', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-2', 'Beta', 0]}
          startingBudget={300}
          rosterSlots={{
            C: 1,
            '1B': 0,
            '2B': 0,
            '3B': 0,
            SS: 0,
            CI: 0,
            MI: 0,
            OF: 0,
            DH: 0,
            SP: 1,
            RP: 0,
            UTIL: 0,
            BENCH: 1,
          }}
          takenPlayers={[['player-william', 'team-2', 'C-0', 15]]}
        />
      </ChakraProvider>,
    );

    expect(screen.getByText('Budget: $285')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByDisplayValue('W. Contreras')).toBeTruthy(),
    );
    expect(screen.getByText('MIL')).toBeTruthy();
    expect(
      screen.getAllByPlaceholderText('Search players...').length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByDisplayValue('15')).toBeTruthy();
  });

  it('updates budget when a valid price is edited', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-3', 'Gamma', 0]}
          startingBudget={100}
          rosterSlots={{
            C: 1,
            '1B': 1,
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
          }}
          takenPlayers={[
            ['player-a', 'team-3', 'C-0', 10],
            ['player-b', 'team-3', '1B-0', 20],
          ]}
        />
      </ChakraProvider>,
    );

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '25' } });

    expect(screen.getByText('Budget: $55')).toBeTruthy();
    expect(inputs[0]?.value).toBe('25');
  });

  it('does not allow a price above the team budget available for that slot', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-4', 'Delta', 0]}
          startingBudget={100}
          rosterSlots={{
            C: 1,
            '1B': 1,
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
          }}
          takenPlayers={[
            ['player-a', 'team-4', 'C-0', 10],
            ['player-b', 'team-4', '1B-0', 20],
          ]}
        />
      </ChakraProvider>,
    );

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '90' } });

    expect(inputs[0]?.value).toBe('10');
    expect(screen.getByText('Budget: $70')).toBeTruthy();
  });

  it('calls through price handlers when provided', async () => {
    const onSaveChanges = vi.fn();

    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-5', 'Echo', 0]}
          startingBudget={50}
          rosterSlots={{
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
          }}
          takenPlayers={[['player-a', 'team-5', 'C-0', 10]]}
          onSaveChanges={onSaveChanges}
        />
      </ChakraProvider>,
    );

    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.change(screen.getByDisplayValue('Echo'), {
      target: { value: 'Echo Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSaveChanges).toHaveBeenCalledWith({
      teamName: 'Echo Updated',
      rows: [{ rowId: 'C-0', playerId: 'player-a', price: 15 }],
    });
  });

  it('keeps prices attached to their position slots instead of array order', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-6', 'Foxtrot', 0]}
          startingBudget={260}
          rosterSlots={{
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
          }}
          takenPlayers={[
            ['player-catcher', 'team-6', 'C-0', 100],
            ['player-firstbase', 'team-6', '1B-0', 35],
            ['player-outfielder', 'team-6', 'OF-0', 22],
          ]}
        />
      </ChakraProvider>,
    );

    expect(screen.getByDisplayValue('F. Player')).toBeTruthy();
    expect(screen.getByDisplayValue('35')).toBeTruthy();
    expect(screen.getByDisplayValue('Outfielder')).toBeTruthy();
    expect(screen.getByDisplayValue('22')).toBeTruthy();
    expect(screen.queryByDisplayValue('100')).toBeNull();
  });

  it('excludes taken players from other teams from all dropdown options', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 100]}
          startingBudget={100}
          rosterSlots={{
            C: 2,
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
          }}
          takenPlayers={[
            // Adley is taken by another team — should not appear in any slot
            ['player-adley', 'team-2', 'C-0', 20],
          ]}
        />
      </ChakraProvider>,
    );

    const datalists = document.querySelectorAll('datalist');
    for (const datalist of datalists) {
      const options = Array.from(datalist.querySelectorAll('option')).map(
        (o) => o.value,
      );
      expect(options).not.toContain('Adley Rutschman');
      // Other catchers should still be available
      expect(options).toContain('William Contreras');
    }
  });

  it('excludes a player already assigned in one slot from all other slots on the same team', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 100]}
          startingBudget={100}
          rosterSlots={{
            C: 2,
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
          }}
          takenPlayers={[
            // Adley is assigned to slot C-0 on this team
            ['player-adley', 'team-1', 'C-0', 20],
          ]}
        />
      </ChakraProvider>,
    );

    const datalists = document.querySelectorAll('datalist');

    // C-0's own datalist: Adley should still appear (it's the player assigned there)
    // C-1's datalist: Adley should be excluded since they're taken in C-0
    const secondDatalist = datalists[1];
    const secondOptions = Array.from(
      secondDatalist.querySelectorAll('option'),
    ).map((o) => o.value);
    expect(secondOptions).not.toContain('Adley Rutschman');
    expect(secondOptions).toContain('William Contreras');
  });

  it('excludes a taken player from every datalist in the league, including their own slot', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 100]}
          startingBudget={100}
          rosterSlots={{
            C: 2,
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
          }}
          takenPlayers={[['player-adley', 'team-1', 'C-0', 20]]}
        />
      </ChakraProvider>,
    );

    const datalists = document.querySelectorAll('datalist');
    for (const datalist of datalists) {
      const options = Array.from(datalist.querySelectorAll('option')).map(
        (o) => o.value,
      );
      // Adley is taken in C-0 — should not appear in any slot's dropdown,
      // including C-0 itself
      expect(options).not.toContain('Adley Rutschman');
      // Other eligible players should still be available
      expect(options).toContain('William Contreras');
    }
  });

  it('excludes players taken by other teams when allTakenPlayers is provided', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 100]}
          startingBudget={100}
          rosterSlots={{
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
          }}
          takenPlayers={[]}
          allTakenPlayers={[['player-adley', 'team-2', 'C-0', 20]]}
        />
      </ChakraProvider>,
    );

    const datalist = document.querySelector('datalist');
    expect(datalist).toBeTruthy();
    const options = Array.from(datalist!.querySelectorAll('option')).map(
      (o) => o.value,
    );
    expect(options).not.toContain('Adley Rutschman');
    expect(options).toContain('William Contreras');
  });

  it('starts collapsed showing only the header, not the table rows', async () => {
    render(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-collapse', 'CollapseTest', 0]}
          startingBudget={100}
          rosterSlots={{
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
          }}
          takenPlayers={[['player-adley', 'team-collapse', 'C-0', 10]]}
        />
      </ChakraProvider>,
    );

    expect(screen.getByDisplayValue('CollapseTest')).toBeTruthy();
    expect(screen.getByText('Budget: $90')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Search players...')).toBeNull();
    expect(screen.queryByRole('button', { name: /save changes/i })).toBeNull();
  });

  it('expands to show table rows when header is clicked and collapses again on second click', async () => {
    render(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-toggle', 'ToggleTest', 0]}
          startingBudget={100}
          rosterSlots={{
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
          }}
          takenPlayers={[['player-adley', 'team-toggle', 'C-0', 10]]}
          onSaveChanges={vi.fn()}
        />
      </ChakraProvider>,
    );

    const budgetText = screen.getByText('Budget: $90');

    // Expand
    fireEvent.click(budgetText);
    await screen.findByPlaceholderText('Search players...');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy();

    // Collapse again
    fireEvent.click(budgetText);
    expect(screen.queryByPlaceholderText('Search players...')).toBeNull();
    expect(screen.queryByRole('button', { name: /save changes/i })).toBeNull();
  });

  it('moves a player from one position slot to another within the same team in draft mode', async () => {
    const onDirtyChange = vi.fn();
    const onCrossTeamTransfer = vi.fn();

    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 0]}
          startingBudget={260}
          rosterSlots={{
            C: 2,
            '1B': 0,
            '2B': 0,
            '3B': 0,
            SS: 0,
            CI: 0,
            MI: 0,
            OF: 0,
            SP: 0,
            RP: 0,
            UTIL: 0,
            BENCH: 0,
          }}
          takenPlayers={[['player-adley', 'team-1', 'C-0', 30]]}
          allTakenPlayers={[['player-adley', 'team-1', 'C-0', 30]]}
          onDirtyChange={onDirtyChange}
          onCrossTeamTransfer={onCrossTeamTransfer}
          draftMode
        />
      </ChakraProvider>,
    );

    // C-0 should show player; wait for name to populate
    await waitFor(() =>
      expect(screen.getByDisplayValue('A. Rutschman')).toBeTruthy(),
    );

    // C-1 is empty — fire change to move player there
    const searchInputs = screen.getAllByPlaceholderText('Search players...');
    const emptyInput = searchInputs.find(
      (el) => (el as HTMLInputElement).value === '',
    )!;
    fireEvent.change(emptyInput, { target: { value: 'Adley Rutschman' } });

    // Player should now be in C-1; C-0 cleared
    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText('Search players...');
      expect(
        inputs.some((el) => (el as HTMLInputElement).value === 'A. Rutschman'),
      ).toBe(true);
    });

    expect(onDirtyChange).toHaveBeenCalledWith('team-1', true);
    expect(onCrossTeamTransfer).not.toHaveBeenCalled();
  });

  it('calls onCrossTeamTransfer when a drafted player from another team is assigned to a slot', async () => {
    const onCrossTeamTransfer = vi.fn();

    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 0]}
          startingBudget={260}
          rosterSlots={{
            C: 1,
            '1B': 0,
            '2B': 0,
            '3B': 0,
            SS: 0,
            CI: 0,
            MI: 0,
            OF: 0,
            SP: 0,
            RP: 0,
            UTIL: 0,
            BENCH: 0,
          }}
          takenPlayers={[]}
          allTakenPlayers={[['player-adley', 'team-2', 'C-0', 30]]}
          onCrossTeamTransfer={onCrossTeamTransfer}
          draftMode
        />
      </ChakraProvider>,
    );

    const searchInput = screen.getByPlaceholderText('Search players...');
    fireEvent.change(searchInput, { target: { value: 'Adley Rutschman' } });

    expect(onCrossTeamTransfer).toHaveBeenCalledWith('player-adley', 'team-1');

    await waitFor(() =>
      expect(
        (screen.getByPlaceholderText('Search players...') as HTMLInputElement)
          .value,
      ).toBe('A. Rutschman'),
    );
  });

  it('filters dropdown options by position and allows all hitters in UTIL and all players in BENCH', async () => {
    await renderLeagueTeamTable(
      <ChakraProvider>
        <LeagueTeamTable
          team={['team-1', 'Alpha', 100]}
          startingBudget={100}
          rosterSlots={{
            C: 1,
            UTIL: 1,
            BENCH: 1,
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
          }}
          takenPlayers={[]}
        />
      </ChakraProvider>,
    );

    const datalists = document.querySelectorAll('datalist');
    expect(datalists).toHaveLength(3);

    const firstOptions = Array.from(
      datalists[0].querySelectorAll('option'),
    ).map((option) => option.value);
    expect(firstOptions).toContain('Adley Rutschman');
    expect(firstOptions).not.toContain('Mock Player SP');

    const secondOptions = Array.from(
      datalists[1].querySelectorAll('option'),
    ).map((option) => option.value);
    expect(secondOptions).toContain('Player A');
    expect(secondOptions).toContain('First Base Player');
    expect(secondOptions).not.toContain('Mock Player SP');

    const thirdOptions = Array.from(
      datalists[2].querySelectorAll('option'),
    ).map((option) => option.value);
    expect(thirdOptions).toContain('Adley Rutschman');
    expect(thirdOptions).toContain('Mock Player SP');
  });
});
