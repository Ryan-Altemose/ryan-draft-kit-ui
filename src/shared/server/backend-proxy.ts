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

function getBackendInternalAuthSecret(): string {
  const secret = process.env.BACKEND_INTERNAL_AUTH_SECRET;

  if (!secret) {
    throw new Error(
      'BACKEND_INTERNAL_AUTH_SECRET is required for protected routes',
    );
  }

  return secret;
}

function buildHeaders(request: Request, backendUserId?: string): HeadersInit {
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

  if (backendUserId) {
    headers['X-Internal-User-Id'] = backendUserId;
    headers['X-Internal-Auth-Secret'] = getBackendInternalAuthSecret();
  }

  return headers;
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
