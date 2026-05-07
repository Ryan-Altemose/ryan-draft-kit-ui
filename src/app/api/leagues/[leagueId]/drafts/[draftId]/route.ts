import { proxyBackendRequest } from '@/shared/server/backend-proxy';

type RouteContext = {
  params: Promise<{ leagueId: string; draftId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { leagueId, draftId } = await context.params;
  return proxyBackendRequest(
    request,
    `/api/leagues/${leagueId}/drafts/${draftId}`,
  );
}
