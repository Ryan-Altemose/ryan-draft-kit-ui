import { proxyDraftSaveBackendRequest } from '@/shared/server/backend-proxy';

type RouteContext = {
  params: Promise<{
    leagueId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { leagueId } = await context.params;
  return proxyDraftSaveBackendRequest(request, `/api/leagues/${leagueId}`);
}
