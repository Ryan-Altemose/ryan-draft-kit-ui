import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/shared/constants';
import {
  ApiError,
  backendClient,
  localApiClient,
  setBackendUnauthorizedHandler,
} from './api-client';

describe('api-client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
    setBackendUnauthorizedHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setBackendUnauthorizedHandler(null);
  });

  it('attaches X-User-Id to league requests', async () => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('user-123'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    await localApiClient.get('/api/leagues');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-User-Id': 'user-123',
    });
  });

  it('attaches X-User-Id to notebook requests', async () => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('user-456'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    await localApiClient.get('/api/notebooks');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).toMatchObject({
      'X-User-Id': 'user-456',
    });
  });

  it('attaches X-User-Id to users/me requests', async () => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('user-789'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: {} }),
    });

    await localApiClient.get('/api/users/me');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).toMatchObject({
      'X-User-Id': 'user-789',
    });
  });

  it('does not attach X-User-Id when creating a user', async () => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('user-999'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: {} }),
    });

    await localApiClient.post('/api/users', {
      name: 'Draft Kit User',
      externalId: 'external-123',
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).not.toMatchObject({
      'X-User-Id': 'user-999',
    });
  });

  it('clears the stored user id and invokes the unauthorized handler on 401', async () => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('user-111'));
    const unauthorizedHandler = vi.fn();
    setBackendUnauthorizedHandler(unauthorizedHandler);

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ message: 'Missing X-User-Id header' }),
    });

    await expect(localApiClient.get('/api/notebooks')).rejects.toBeInstanceOf(
      ApiError,
    );

    expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBeNull();
    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);
  });

  it('attaches X-User-Id to direct backend league requests', async () => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify('user-222'));
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    await backendClient.get('/api/leagues');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).toMatchObject({
      'X-User-Id': 'user-222',
    });
  });
});
