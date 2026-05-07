import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.stubGlobal('fetch', fetchMock);
    setBackendUnauthorizedHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setBackendUnauthorizedHandler(null);
  });

  it('does not attach X-User-Id to league requests', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    await localApiClient.get('/api/leagues');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).not.toMatchObject({
      'X-User-Id': expect.anything(),
    });
  });

  it('does not attach X-User-Id to notebook requests', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    await localApiClient.get('/api/notebooks');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).not.toMatchObject({
      'X-User-Id': expect.anything(),
    });
  });

  it('does not attach X-User-Id to users/me requests', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: {} }),
    });

    await localApiClient.get('/api/users/me');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).not.toMatchObject({
      'X-User-Id': expect.anything(),
    });
  });

  it('does not attach X-User-Id to session requests', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: {} }),
    });

    await localApiClient.get('/api/session');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).not.toMatchObject({
      'X-User-Id': expect.anything(),
    });
  });

  it('invokes the unauthorized handler on 401', async () => {
    const unauthorizedHandler = vi.fn();
    setBackendUnauthorizedHandler(unauthorizedHandler);

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ message: 'Authentication required' }),
    });

    await expect(localApiClient.get('/api/notebooks')).rejects.toBeInstanceOf(
      ApiError,
    );

    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);
  });

  it('does not attach X-User-Id to direct backend league requests', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    await backendClient.get('/api/leagues');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).not.toMatchObject({
      'X-User-Id': expect.anything(),
    });
  });
});
