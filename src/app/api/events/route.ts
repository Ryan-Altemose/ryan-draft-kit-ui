import { proxyBackendStreamRequest } from '@/shared/server/backend-proxy';

export async function GET(request: Request) {
  return proxyBackendStreamRequest(request, '/api/events');
}
