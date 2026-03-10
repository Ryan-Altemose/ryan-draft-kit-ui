import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import CreateLeagueModal from './CreateLeagueModal';

// mock hook
const mutateAsyncMock = vi.fn();

vi.mock('../hooks/useCreateLeague', () => ({
  useCreateLeague: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
}));

function renderModal() {
  render(
    <ChakraProvider>
      <CreateLeagueModal isOpen={true} onClose={vi.fn()} />
    </ChakraProvider>,
  );
}

describe('CreateLeagueModal', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
  });

  it('renders modal fields', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: /create league/i })).toBeTruthy();
    expect(screen.getByLabelText(/league name/i)).toBeTruthy();
    expect(screen.getByLabelText(/# of teams/i)).toBeTruthy();
    expect(screen.getByLabelText(/draft type/i)).toBeTruthy();
  });

  it('shows default values', () => {
    renderModal();

    const teamsInput = screen.getByLabelText(/# of teams/i) as HTMLInputElement;
    expect(teamsInput.value).toBe('12');

    const cInput = screen.getAllByRole('spinbutton')[1] as HTMLInputElement;
    expect(cInput.value).toBe('1');
  });

  it('submit button disabled when league name empty', () => {
    renderModal();

    const button = screen.getByRole('button', {
      name: 'Create League',
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('submit button enabled when league name entered', () => {
    renderModal();

    const nameInput = screen.getByLabelText(/league name/i);
    fireEvent.change(nameInput, { target: { value: 'My League' } });

    const button = screen.getByRole('button', {
      name: 'Create League',
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('submits correct payload', async () => {
    mutateAsyncMock.mockResolvedValue({});

    renderModal();

    const nameInput = screen.getByLabelText(/league name/i);
    fireEvent.change(nameInput, { target: { value: 'Test League' } });

    const button = screen.getByRole('button', { name: 'Create League' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    const payload = mutateAsyncMock.mock.calls[0][0];

    expect(payload.name).toBe('Test League');
    expect(payload.teams).toBe(12);
    expect(payload.draftType).toBe('auction');

    await waitFor(() => {
      const updatedNameInput = screen.getByLabelText(
        /league name/i,
      ) as HTMLInputElement;
      expect(updatedNameInput.value).toBe('');
    });
  });

  it('negative roster values convert to 0', () => {
    renderModal();

    const rosterInputs = screen.getAllByRole('spinbutton');
    const firstRosterInput = rosterInputs[1];

    fireEvent.change(firstRosterInput, { target: { value: '-5' } });

    const updated = rosterInputs[1] as HTMLInputElement;
    expect(updated.value).toBe('0');
  });
});
