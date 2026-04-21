import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is required');
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

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return headers;
}

export async function proxyBackendRequest(
  request: Request,
  endpoint: string,
): Promise<NextResponse> {
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
}
