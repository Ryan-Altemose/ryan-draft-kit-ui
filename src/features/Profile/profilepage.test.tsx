import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import ProfilePage from './profilepage';

const reinitializeMock = vi.fn();
const signOutUserMock = vi.fn();
const refetchMock = vi.fn();
const mockUseUserSession = vi.fn();
const mockUseCurrentUserProfile = vi.fn();

vi.mock('@/features/UserSession/user-session-provider', () => ({
  useUserSession: () => mockUseUserSession(),
}));

vi.mock('./hooks/useCurrentUserProfile', () => ({
  useCurrentUserProfile: (userId?: string) => mockUseCurrentUserProfile(userId),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserSession.mockReturnValue({
      currentUser: {
        userId: 'user-123',
        provider: 'google',
        providerSubject: 'google-subject-123',
        name: 'Draft Kit User',
        email: 'user@example.com',
        image: 'https://example.com/avatar.png',
      },
      errorMessage: null,
      reinitialize: reinitializeMock,
      signOutUser: signOutUserMock,
    });
    mockUseCurrentUserProfile.mockReturnValue({
      data: {
        data: {
          _id: 'user-123',
          name: 'Draft Kit User',
          email: 'user@example.com',
          authProvider: 'google',
          providerSubject: 'google-subject-123',
          avatarUrl: 'https://example.com/avatar.png',
          externalId: 'external-123',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-02T00:00:00.000Z',
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
    });
  });

  it('renders current session and backend user fields', () => {
    render(
      <ChakraProvider>
        <ProfilePage />
      </ChakraProvider>,
    );

    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Session')).toBeTruthy();
    expect(screen.getByText('Backend User')).toBeTruthy();
    expect(screen.getAllByText('user-123')).toHaveLength(2);
    expect(screen.getAllByText('google')).toHaveLength(2);
    expect(screen.getAllByText('google-subject-123')).toHaveLength(2);
    expect(screen.getAllByText('Draft Kit User')).toHaveLength(2);
    expect(screen.getAllByText('user@example.com')).toHaveLength(2);
    expect(screen.getByText('2026-05-01T00:00:00.000Z')).toBeTruthy();
    expect(screen.getByText('2026-05-02T00:00:00.000Z')).toBeTruthy();
  });

  it('wires the refresh, reinitialize, and sign out actions', () => {
    render(
      <ChakraProvider>
        <ProfilePage />
      </ChakraProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Reinitialize Session' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
    expect(reinitializeMock).toHaveBeenCalledTimes(1);
    expect(signOutUserMock).toHaveBeenCalledTimes(1);
  });

  it('shows a backend profile error', () => {
    mockUseCurrentUserProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('Unable to load backend user profile.'),
      refetch: refetchMock,
    });

    render(
      <ChakraProvider>
        <ProfilePage />
      </ChakraProvider>,
    );

    expect(
      screen.getByText('Unable to load backend user profile.'),
    ).toBeTruthy();
  });
});
