import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import NotebookWorkspace from './NotebookWorkspace';

vi.mock('./TopPlayersPanel', () => ({
  default: ({
    onOpenPlayer,
  }: {
    onOpenPlayer: (player: {
      _id: string;
      name: string;
      team: string;
      positions: string[];
      injuryStatus: string;
    }) => void;
  }) => (
    <button
      onClick={() =>
        onOpenPlayer({
          _id: 'player-1',
          name: 'Aaron Judge',
          team: 'NYY',
          positions: ['OF'],
          injuryStatus: 'active',
        })
      }
    >
      Open Player
    </button>
  ),
}));

describe('NotebookWorkspace', () => {
  it('updates custom notebook content through the textarea', () => {
    const onNotebookContentChange = vi.fn();

    render(
      <ChakraProvider>
        <NotebookWorkspace
          selectedNotebookId="notebook-1"
          selectedNotebookName="Draft Notes"
          selectedNotebookContent="Initial content"
          onNotebookContentChange={onNotebookContentChange}
          onPlayerContentChange={vi.fn()}
          selectedPlayerName={null}
          selectedPlayer={null}
          onCloseNotebook={vi.fn()}
          onOpenPlayerNotebook={vi.fn()}
        />
      </ChakraProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Write notes here...'), {
      target: { value: 'Updated content' },
    });

    expect(onNotebookContentChange).toHaveBeenCalledWith(
      'notebook-1',
      'Updated content',
    );
  });

  it('updates player note content and shows player stats', () => {
    const onPlayerContentChange = vi.fn();

    render(
      <ChakraProvider>
        <NotebookWorkspace
          selectedNotebookId={null}
          selectedNotebookName="Aaron Judge"
          selectedNotebookContent="Monitor injury"
          onNotebookContentChange={vi.fn()}
          onPlayerContentChange={onPlayerContentChange}
          selectedPlayerName="Aaron Judge"
          selectedPlayer={{
            _id: 'player-1',
            name: 'Aaron Judge',
            team: 'NYY',
            positions: ['OF'],
            injuryStatus: 'active',
            playerType: 'hitter',
            league: 'AL',
            age: 32,
            batSide: 'R',
          }}
          onCloseNotebook={vi.fn()}
          onOpenPlayerNotebook={vi.fn()}
        />
      </ChakraProvider>,
    );

    expect(screen.getByText('Player Info')).toBeTruthy();
    expect(screen.getByText('Team: NYY')).toBeTruthy();
    expect(screen.getByText('Positions: OF')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Write notes here...'), {
      target: { value: 'Updated player note' },
    });

    expect(onPlayerContentChange).toHaveBeenCalledWith(
      'Aaron Judge',
      'Updated player note',
    );
  });

  it('passes selected players through the top players panel action', () => {
    const onOpenPlayerNotebook = vi.fn();

    render(
      <ChakraProvider>
        <NotebookWorkspace
          selectedNotebookId={null}
          selectedNotebookName={null}
          selectedNotebookContent=""
          onNotebookContentChange={vi.fn()}
          onPlayerContentChange={vi.fn()}
          selectedPlayerName={null}
          selectedPlayer={null}
          onCloseNotebook={vi.fn()}
          onOpenPlayerNotebook={onOpenPlayerNotebook}
        />
      </ChakraProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Player' }));

    expect(onOpenPlayerNotebook).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'player-1',
        name: 'Aaron Judge',
      }),
    );
  });
});
