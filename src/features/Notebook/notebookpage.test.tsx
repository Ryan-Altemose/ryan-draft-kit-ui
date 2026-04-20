import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import NotebookPage from './notebookpage';

const mockUseNotebookManager = vi.fn();
const baseManagerState = {
  notebooks: [{ _id: 'notebook-1', name: 'Draft Notes' }],
  selectedNotebookId: 'notebook-1',
  selectedNotebookName: 'Draft Notes',
  selectedNotebookContent: 'Track targets',
  selectedPlayerName: null,
  selectedPlayer: null,
  isLoadingNotebooks: false,
  notebooksError: null,
  saveError: null,
  addNotebook: vi.fn(),
  renameNotebook: vi.fn(),
  removeNotebook: vi.fn(),
  updateNotebookContent: vi.fn(),
  updatePlayerContent: vi.fn(),
  openNotebook: vi.fn(),
  openPlayerNotebook: vi.fn(),
  closeNotebook: vi.fn(),
};

vi.mock('./hooks/useNotebookManager', () => ({
  useNotebookManager: () => mockUseNotebookManager(),
}));

vi.mock('./hooks/useTopPlayers', () => ({
  useTopPlayers: () => ({
    players: [],
    isLoadingPlayers: false,
    playersError: null,
  }),
}));

describe('NotebookPage', () => {
  beforeEach(() => {
    mockUseNotebookManager.mockReset();
    mockUseNotebookManager.mockReturnValue({
      ...baseManagerState,
      addNotebook: vi.fn(),
      renameNotebook: vi.fn(),
      removeNotebook: vi.fn(),
      updateNotebookContent: vi.fn(),
      updatePlayerContent: vi.fn(),
      openNotebook: vi.fn(),
      openPlayerNotebook: vi.fn(),
      closeNotebook: vi.fn(),
    });
  });

  it('renders notebook data from the manager hook', () => {
    render(
      <ChakraProvider>
        <NotebookPage />
      </ChakraProvider>,
    );

    expect(screen.getAllByText('Draft Notes')).toHaveLength(2);
    expect(screen.getByDisplayValue('Track targets')).toBeTruthy();
  });

  it('shows save errors from the manager hook', () => {
    mockUseNotebookManager.mockReturnValue({
      ...baseManagerState,
      saveError: 'Unable to save notebook changes.',
    });

    render(
      <ChakraProvider>
        <NotebookPage />
      </ChakraProvider>,
    );

    expect(screen.getByText('Unable to save notebook changes.')).toBeTruthy();
  });

  it('wires delete actions through the manager hook', () => {
    const removeNotebook = vi.fn();
    mockUseNotebookManager.mockReturnValue({
      ...baseManagerState,
      removeNotebook,
    });

    render(
      <ChakraProvider>
        <NotebookPage />
      </ChakraProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(removeNotebook).toHaveBeenCalledWith('notebook-1');
  });
});
