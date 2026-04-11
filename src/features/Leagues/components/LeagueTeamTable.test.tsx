import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import LeagueTeamTable from './LeagueTeamTable';

const fetchMock = vi.fn();

async function renderLeagueTeamTable(element: JSX.Element) {
  render(element);
  await screen.findAllByRole('combobox');
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
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-freddie',
            name: 'Freddie Freeman',
            positions: ['1B'],
            playerType: 'hitter',
          },
          {
            _id: 'player-julio',
            name: 'Julio Rodriguez',
            positions: ['OF'],
            playerType: 'hitter',
          },
          {
            _id: 'player-william',
            name: 'William Contreras',
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-a',
            name: 'Player A',
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-b',
            name: 'Player B',
            positions: ['1B'],
            playerType: 'hitter',
          },
          {
            _id: 'player-catcher',
            name: 'Catcher Player',
            positions: ['C'],
            playerType: 'hitter',
          },
          {
            _id: 'player-firstbase',
            name: 'First Base Player',
            positions: ['1B'],
            playerType: 'hitter',
          },
          {
            _id: 'player-outfielder',
            name: 'Outfielder',
            positions: ['OF'],
            playerType: 'hitter',
          },
          {
            _id: 'player-sp',
            name: 'Mock Player SP',
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
    expect(screen.getAllByText('Adley Rutschman').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Freddie Freeman').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Julio Rodriguez').length).toBeGreaterThan(0);
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
    expect(screen.getAllByText('William Contreras').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Select player').length).toBeGreaterThanOrEqual(
      2,
    );
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

    expect(screen.getAllByText('First Base Player').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('35')).toBeTruthy();
    expect(screen.getAllByText('Outfielder').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('22')).toBeTruthy();
    expect(screen.queryByDisplayValue('100')).toBeNull();
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
            OF: 0,
            DH: 0,
            SP: 0,
            RP: 0,
          }}
          takenPlayers={[]}
        />
      </ChakraProvider>,
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects).toHaveLength(3);

    // C row should only show C-eligible players
    expect(selects[0].textContent).toContain('Adley Rutschman');
    expect(selects[0].textContent).not.toContain('Mock Player SP');

    // UTIL should show only hitters
    expect(selects[1].textContent).toContain('Player A');
    expect(selects[1].textContent).toContain('First Base Player');
    expect(selects[1].textContent).not.toContain('Mock Player SP');

    // BENCH should show everyone, including pitchers
    expect(selects[2].textContent).toContain('Adley Rutschman');
    expect(selects[2].textContent).toContain('Mock Player SP');
  });
});
