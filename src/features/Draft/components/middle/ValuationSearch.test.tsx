import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ValuationSearch from './ValuationSearch';

const fetchMock = vi.fn();

// Last-name alphabetical order: Freeman, Judge, Ramirez, Trout
const PLAYERS = [
  {
    _id: 'p1',
    name: 'Aaron Judge',
    team: 'NYY',
    positions: ['OF'],
    injuryStatus: 'active',
    league: 'AL',
  },
  {
    _id: 'p2',
    name: 'Freddie Freeman',
    team: 'LAD',
    positions: ['1B'],
    injuryStatus: 'active',
    league: 'NL',
  },
  {
    _id: 'p3',
    name: 'Mike Trout',
    team: 'LAA',
    positions: ['OF'],
    injuryStatus: 'active',
    league: 'AL',
  },
  {
    _id: 'p4',
    name: 'Jose Ramirez',
    team: 'CLE',
    positions: ['3B'],
    injuryStatus: 'active',
    league: 'AL',
  },
];

async function renderAndWait() {
  render(
    <ChakraProvider>
      <ValuationSearch />
    </ChakraProvider>,
  );
  await screen.findByText('Freddie Freeman', undefined, { timeout: 3000 });
}

describe('ValuationSearch', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: PLAYERS,
        pagination: { totalPages: 1 },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('position filtering', () => {
    it('shows all players on initial load', async () => {
      await renderAndWait();
      expect(screen.getByText('Aaron Judge')).toBeTruthy();
      expect(screen.getByText('Freddie Freeman')).toBeTruthy();
      expect(screen.getByText('Mike Trout')).toBeTruthy();
      expect(screen.getByText('Jose Ramirez')).toBeTruthy();
    });

    it('shows only matching players when a single position is selected', async () => {
      await renderAndWait();
      fireEvent.click(screen.getByRole('button', { name: 'OF' }));
      expect(screen.getByText('Aaron Judge')).toBeTruthy();
      expect(screen.getByText('Mike Trout')).toBeTruthy();
      expect(screen.queryByText('Freddie Freeman')).toBeNull();
      expect(screen.queryByText('Jose Ramirez')).toBeNull();
    });

    it('shows players matching any selected position when multiple are active', async () => {
      await renderAndWait();
      fireEvent.click(screen.getByRole('button', { name: 'OF' }));
      fireEvent.click(screen.getByRole('button', { name: '1B' }));
      expect(screen.getByText('Aaron Judge')).toBeTruthy();
      expect(screen.getByText('Freddie Freeman')).toBeTruthy();
      expect(screen.getByText('Mike Trout')).toBeTruthy();
      expect(screen.queryByText('Jose Ramirez')).toBeNull();
    });

    it('deselects a position when clicked again and restores hidden players', async () => {
      await renderAndWait();
      fireEvent.click(screen.getByRole('button', { name: 'OF' }));
      expect(screen.queryByText('Freddie Freeman')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'OF' }));
      expect(screen.getByText('Freddie Freeman')).toBeTruthy();
    });

    it('All button clears all active position selections and shows every player', async () => {
      await renderAndWait();
      fireEvent.click(screen.getByRole('button', { name: 'OF' }));
      fireEvent.click(screen.getByRole('button', { name: '1B' }));
      fireEvent.click(screen.getByRole('button', { name: 'All' }));
      expect(screen.getByText('Aaron Judge')).toBeTruthy();
      expect(screen.getByText('Freddie Freeman')).toBeTruthy();
      expect(screen.getByText('Mike Trout')).toBeTruthy();
      expect(screen.getByText('Jose Ramirez')).toBeTruthy();
    });
  });

  describe('column sort', () => {
    it('cycles the Name header indicator through ascending, descending, and off', async () => {
      await renderAndWait();
      const nameHeader = screen.getByRole('columnheader', { name: /^name/i });

      fireEvent.click(nameHeader);
      expect(screen.getByText('▲')).toBeTruthy();

      fireEvent.click(nameHeader);
      expect(screen.getByText('▼')).toBeTruthy();

      fireEvent.click(nameHeader);
      expect(screen.queryByText('▲')).toBeNull();
      expect(screen.queryByText('▼')).toBeNull();
    });

    it('sorts by last name descending after the Name header is clicked twice', async () => {
      await renderAndWait();
      // Default sort is by $ Value desc; clicking Name twice results in last name desc.
      const nameHeader = screen.getByRole('columnheader', { name: /^name/i });
      fireEvent.click(nameHeader); // asc (same as default)
      fireEvent.click(nameHeader); // desc: Trout, Ramirez, Judge, Freeman

      const rows = screen.getAllByRole('row').slice(1); // skip header
      expect(within(rows[0]).getByText('Mike Trout')).toBeTruthy();
      expect(
        within(rows[rows.length - 1]).getByText('Freddie Freeman'),
      ).toBeTruthy();
    });

    it('places valued players above unvalued ones when sorted by $ Value descending', async () => {
      render(
        <ChakraProvider>
          <ValuationSearch valuations={{ p1: 30, p3: 25 }} />
        </ChakraProvider>,
      );
      await screen.findByText('Freddie Freeman', undefined, { timeout: 3000 });

      const rows = screen.getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText('Aaron Judge')).toBeTruthy();
      expect(within(rows[1]).getByText('Mike Trout')).toBeTruthy();
    });
  });

  describe('row click', () => {
    it('calls onPlayerClick with the clicked player when a row is clicked', async () => {
      const onPlayerClick = vi.fn();
      render(
        <ChakraProvider>
          <ValuationSearch onPlayerClick={onPlayerClick} />
        </ChakraProvider>,
      );
      await screen.findByText('Freddie Freeman', undefined, { timeout: 3000 });

      // First row after load is Freeman (alphabetically first by last name)
      const rows = screen.getAllByRole('row').slice(1);
      fireEvent.click(rows[0]);

      expect(onPlayerClick).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Freddie Freeman' }),
      );
    });
  });

  describe('eligibility filtering', () => {
    it('hides taken players', async () => {
      render(
        <ChakraProvider>
          <ValuationSearch takenPlayers={[['p2', 't1', 'BENCH', 1, '']]} />
        </ChakraProvider>,
      );
      await screen.findByText('Aaron Judge', undefined, { timeout: 3000 });

      expect(screen.queryByText('Freddie Freeman')).toBeNull();
      expect(screen.getByText('Aaron Judge')).toBeTruthy();
    });

    it('filters by leagueType (AL)', async () => {
      render(
        <ChakraProvider>
          <ValuationSearch leagueType="AL" />
        </ChakraProvider>,
      );
      await screen.findByText('Aaron Judge', undefined, { timeout: 3000 });

      expect(screen.getByText('Aaron Judge')).toBeTruthy();
      expect(screen.getByText('Mike Trout')).toBeTruthy();
      expect(screen.getByText('Jose Ramirez')).toBeTruthy();
      expect(screen.queryByText('Freddie Freeman')).toBeNull();
    });
  });
});
