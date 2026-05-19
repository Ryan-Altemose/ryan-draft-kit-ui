import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ImportLeagueModal from './ImportLeagueModal';

const mutateAsyncMock = vi.fn();
const resetMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../hooks/useImportLeague', () => ({
  useImportLeague: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
    isError: false,
    error: null,
    reset: resetMock,
  }),
}));

function renderModal() {
  render(
    <ChakraProvider>
      <ImportLeagueModal isOpen={true} onClose={vi.fn()} />
    </ChakraProvider>,
  );
}

describe('ImportLeagueModal', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    resetMock.mockReset();
    pushMock.mockReset();
  });

  it('renders import controls', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: /import league json/i }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/upload json file/i)).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /league json/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /import league/i })).toBeTruthy();
  });

  it('loads JSON from an uploaded file', async () => {
    renderModal();

    const fileInput = screen.getByLabelText(/upload json file/i);
    const jsonText = '{"name":"Imported League"}';
    const file = new File([jsonText], 'league.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(
        (
          screen.getByRole('textbox', {
            name: /league json/i,
          }) as HTMLTextAreaElement
        ).value,
      ).toBe(jsonText);
    });

    expect(screen.getByText('league.json')).toBeTruthy();
  });

  it('shows a local error for invalid JSON', async () => {
    renderModal();

    fireEvent.change(screen.getByRole('textbox', { name: /league json/i }), {
      target: { value: '{invalid json' },
    });
    fireEvent.click(screen.getByRole('button', { name: /import league/i }));

    expect(await screen.findByText('Invalid JSON')).toBeTruthy();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('imports valid JSON and redirects to the new league', async () => {
    mutateAsyncMock.mockResolvedValue({
      data: {
        _id: 'league-123',
      },
    });

    renderModal();

    fireEvent.change(screen.getByRole('textbox', { name: /league json/i }), {
      target: {
        value: JSON.stringify({
          name: 'Imported League',
          format: 'roto',
          draftType: 'auction',
          battingCategories: ['R'],
          pitchingCategories: ['W'],
          rosterSlots: {
            C: 1,
            '1B': 1,
            '2B': 1,
            '3B': 1,
            SS: 1,
            CI: 1,
            MI: 1,
            OF: 3,
            SP: 5,
            RP: 2,
            UTIL: 1,
            P: 0,
            BENCH: 5,
          },
          teams: [{ name: 'Team 1' }],
        }),
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /import league/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        name: 'Imported League',
        format: 'roto',
        draftType: 'auction',
        battingCategories: ['R'],
        pitchingCategories: ['W'],
        rosterSlots: {
          C: 1,
          '1B': 1,
          '2B': 1,
          '3B': 1,
          SS: 1,
          CI: 1,
          MI: 1,
          OF: 3,
          SP: 5,
          RP: 2,
          UTIL: 1,
          P: 0,
          BENCH: 5,
        },
        teams: [{ name: 'Team 1' }],
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/leagues/league-123');
    });
  });
});
