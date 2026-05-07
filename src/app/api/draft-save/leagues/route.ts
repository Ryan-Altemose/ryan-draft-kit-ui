import { proxyDraftSaveBackendRequest } from '@/shared/server/backend-proxy';

export async function GET(request: Request) {
  return proxyDraftSaveBackendRequest(request, '/api/leagues');
}

export async function POST(request: Request) {
  return proxyDraftSaveBackendRequest(request, '/api/leagues');
}
