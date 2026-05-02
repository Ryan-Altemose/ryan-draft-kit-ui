import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/shared/constants';
import { bootstrapCurrentUser } from './user-session';

describe('user-session bootstrap', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a user successfully on first load with no stored ids', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: 'user-1',
          name: 'Draft Kit User',
          externalId: 'generated-external',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      }),
    });

    const currentUser = await bootstrapCurrentUser();

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.name).toBe('Draft Kit User');
    expect(body.externalId).toBeTruthy();
    expect(currentUser.userId).toBe('user-1');
    expect(localStorage.getItem(STORAGE_KEYS.EXTERNAL_USER_ID)).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBe(
      JSON.stringify('user-1'),
    );
  });

  it('reuses the same external id after reload', async () => {
    localStorage.setItem(
      STORAGE_KEYS.EXTERNAL_USER_ID,
      JSON.stringify('stable-external'),
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: 'user-2',
          name: 'Draft Kit User',
          externalId: 'stable-external',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      }),
    });

    await bootstrapCurrentUser();

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.externalId).toBe('stable-external');
  });

  it('recovers from a corrupted stored user id', async () => {
    localStorage.setItem(
      STORAGE_KEYS.EXTERNAL_USER_ID,
      JSON.stringify('stable-external'),
    );
    localStorage.setItem(
      STORAGE_KEYS.USER_ID,
      JSON.stringify('corrupted-user'),
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: 'recovered-user',
          name: 'Draft Kit User',
          externalId: 'stable-external',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      }),
    });

    const currentUser = await bootstrapCurrentUser();

    expect(currentUser.userId).toBe('recovered-user');
    expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBe(
      JSON.stringify('recovered-user'),
    );
  });

  it('regenerates an external id when only the user id is stored', async () => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('old-user'));

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: 'user-3',
          name: 'Draft Kit User',
          externalId: 'replacement-external',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      }),
    });

    await bootstrapCurrentUser();

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.externalId).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEYS.EXTERNAL_USER_ID)).toBe(
      JSON.stringify('replacement-external'),
    );
  });
});
