import { proxyBackendStreamRequest } from '@/shared/server/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return proxyBackendStreamRequest(request, '/api/events');
}
