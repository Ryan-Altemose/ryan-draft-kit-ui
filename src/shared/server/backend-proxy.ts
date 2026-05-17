import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';

function getBackendUrl(): string {
  const backendUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error(
      'BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is required for notebook proxying',
    );
  }

  return backendUrl.replace(/\/+$/, '');
}

function getBackendApiKey(): string {
  const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;

  if (!apiKey) {
    throw new Error('API_KEY or NEXT_PUBLIC_API_KEY is required');
  }

  return apiKey;
}

function getDraftSaveBackendUrl(): string {
  const backendUrl =
    process.env.DRAFT_SAVE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DRAFT_SAVE_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error(
      'DRAFT_SAVE_BACKEND_URL, NEXT_PUBLIC_DRAFT_SAVE_BACKEND_URL, BACKEND_URL, or NEXT_PUBLIC_BACKEND_URL is required for draft save proxying',
    );
  }

  return backendUrl.replace(/\/+$/, '');
}

function buildHeaders(request: Request, backendUserId?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-api-key': getBackendApiKey(),
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (backendUserId) {
    headers['X-User-Id'] = backendUserId;
  }

  return headers;
}

export async function proxyBackendStreamRequest(
  request: Request,
  endpoint: string,
): Promise<NextResponse> {
  try {
    const backendUrl = new URL(`${getBackendUrl()}${endpoint}`);
    const incomingUrl = new URL(request.url);
    backendUrl.search = incomingUrl.search;

    const response = await fetch(backendUrl.toString(), {
      method: request.method,
      headers: buildHeaders(request),
      cache: 'no-store',
    });

    if (!response.body) {
      return NextResponse.json(
        { success: false, message: 'Notification stream unavailable' },
        { status: 502 },
      );
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') ?? 'text/event-stream',
        'Cache-Control':
          response.headers.get('cache-control') ?? 'no-cache, no-transform',
        Connection: response.headers.get('connection') ?? 'keep-alive',
        'X-Accel-Buffering': response.headers.get('x-accel-buffering') ?? 'no',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to reach the backend notification stream';

    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}

export async function proxyBackendRequest(
  request: Request,
  endpoint: string,
  requiresAuth: boolean = true,
): Promise<NextResponse> {
  try {
    let backendUserId: string | undefined;

    if (requiresAuth) {
      const session = await getAuthSession();
      backendUserId = session?.user?.backendUserId;

      if (!backendUserId) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 },
        );
      }
    }

    const backendUrl = new URL(`${getBackendUrl()}${endpoint}`);
    const incomingUrl = new URL(request.url);
    backendUrl.search = incomingUrl.search;

    const response = await fetch(backendUrl.toString(), {
      method: request.method,
      headers: buildHeaders(request, backendUserId),
      body:
        request.method === 'GET' ||
        request.method === 'DELETE' ||
        request.method === 'HEAD'
          ? undefined
          : await request.text(),
      cache: 'no-store',
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to reach the backend service';

    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}

export async function proxyDraftSaveBackendRequest(
  request: Request,
  endpoint: string,
): Promise<NextResponse> {
  try {
    const session = await getAuthSession();
    const backendUserId = session?.user?.backendUserId;

    if (!backendUserId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 },
      );
    }

    const backendUrl = new URL(`${getDraftSaveBackendUrl()}${endpoint}`);
    const incomingUrl = new URL(request.url);
    backendUrl.search = incomingUrl.search;

    const response = await fetch(backendUrl.toString(), {
      method: request.method,
      headers: buildHeaders(request, backendUserId),
      body:
        request.method === 'GET' ||
        request.method === 'DELETE' ||
        request.method === 'HEAD'
          ? undefined
          : await request.text(),
      cache: 'no-store',
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to reach the draft save backend service';

    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
