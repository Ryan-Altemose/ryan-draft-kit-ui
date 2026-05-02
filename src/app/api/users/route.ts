import { proxyBackendRequest } from '@/shared/server/backend-proxy';

export async function POST(request: Request) {
  return proxyBackendRequest(request, '/api/users');
}
