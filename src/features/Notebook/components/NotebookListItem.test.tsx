import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import NotebookListItem from './NotebookListItem';

describe('NotebookListItem', () => {
  it('opens the notebook on double click', () => {
    const onOpen = vi.fn();

    render(
      <ChakraProvider>
        <NotebookListItem
          notebook={{ _id: 'notebook-1', name: 'Draft Notes' }}
          isSelected={false}
          onRename={vi.fn()}
          onDelete={vi.fn()}
          onOpen={onOpen}
        />
      </ChakraProvider>,
    );

    fireEvent.doubleClick(screen.getByText('Draft Notes'));

    expect(onOpen).toHaveBeenCalledWith('notebook-1');
  });

  it('commits a rename when editing is finished', () => {
    const onRename = vi.fn();

    render(
      <ChakraProvider>
        <NotebookListItem
          notebook={{ _id: 'notebook-1', name: 'Draft Notes' }}
          isSelected={true}
          onRename={onRename}
          onDelete={vi.fn()}
          onOpen={vi.fn()}
        />
      </ChakraProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = screen.getByDisplayValue('Draft Notes');
    fireEvent.change(input, { target: { value: 'Updated Notes' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('notebook-1', 'Updated Notes');
  });

  it('calls delete when the delete button is clicked', () => {
    const onDelete = vi.fn();

    render(
      <ChakraProvider>
        <NotebookListItem
          notebook={{ _id: 'notebook-1', name: 'Draft Notes' }}
          isSelected={false}
          onRename={vi.fn()}
          onDelete={onDelete}
          onOpen={vi.fn()}
        />
      </ChakraProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith('notebook-1');
  });
});
