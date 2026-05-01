import { NextResponse } from 'next/server';

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

function buildHeaders(request: Request): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const userId = request.headers.get('x-user-id');
  if (userId) {
    headers['X-User-Id'] = userId;
  }

  return headers;
}

export async function proxyBackendRequest(
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
    const backendUrl = new URL(`${getDraftSaveBackendUrl()}${endpoint}`);
    const incomingUrl = new URL(request.url);
    backendUrl.search = incomingUrl.search;

    const response = await fetch(backendUrl.toString(), {
      method: request.method,
      headers: buildHeaders(request),
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
