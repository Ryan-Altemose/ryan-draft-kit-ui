import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapCurrentUser } from './user-session';

describe('user-session bootstrap', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the authenticated Google user session', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        authenticated: true,
        data: {
          userId: 'user-1',
          provider: 'google',
          providerSubject: 'google-user-1',
          name: 'Draft Kit User',
          email: 'user@example.com',
          image: 'https://example.com/avatar.png',
        },
      }),
    });

    const currentUser = await bootstrapCurrentUser();

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/session');
    expect(currentUser).toEqual({
      userId: 'user-1',
      provider: 'google',
      providerSubject: 'google-user-1',
      name: 'Draft Kit User',
      email: 'user@example.com',
      image: 'https://example.com/avatar.png',
    });
  });

  it('returns null when there is no authenticated session', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        authenticated: false,
        data: null,
      }),
    });

    await expect(bootstrapCurrentUser()).resolves.toBeNull();
  });
});
