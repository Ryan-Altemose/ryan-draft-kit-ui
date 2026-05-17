import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AlertWidget from './AlertWidget';

describe('AlertWidget', () => {
  it('renders the alert title and description', () => {
    render(
      <ChakraProvider>
        <AlertWidget
          isOpen={true}
          onClose={vi.fn()}
          category="Draft Update"
          description="A new draft board action is available."
        />
      </ChakraProvider>,
    );

    expect(
      screen.getByRole('dialog', { name: /alert: draft update/i }),
    ).toBeTruthy();
    expect(
      screen.getByText('A new draft board action is available.'),
    ).toBeTruthy();
  });

  it('calls onClose when closed', () => {
    const onClose = vi.fn();

    render(
      <ChakraProvider>
        <AlertWidget
          isOpen={true}
          onClose={onClose}
          category="System"
          description="System maintenance is in progress."
        />
      </ChakraProvider>,
    );

    fireEvent.click(screen.getByText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
