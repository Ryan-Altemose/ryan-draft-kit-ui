import { proxyBackendRequest } from '@/shared/server/backend-proxy';

export async function GET(request: Request) {
  return proxyBackendRequest(request, '/api/notebooks', true);
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, '/api/notebooks', true);
}
