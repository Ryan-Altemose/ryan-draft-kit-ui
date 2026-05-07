import { proxyBackendRequest } from '@/shared/server/backend-proxy';

type RouteContext = {
  params: Promise<{ leagueId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { leagueId } = await context.params;
  return proxyBackendRequest(request, `/api/leagues/${leagueId}/drafts`);
}

export async function POST(request: Request, context: RouteContext) {
  const { leagueId } = await context.params;
  return proxyBackendRequest(request, `/api/leagues/${leagueId}/drafts`);
}
