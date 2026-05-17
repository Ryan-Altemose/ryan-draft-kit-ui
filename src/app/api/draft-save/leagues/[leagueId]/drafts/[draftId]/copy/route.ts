import { proxyDraftSaveBackendRequest } from '@/shared/server/backend-proxy';

type RouteContext = {
  params: Promise<{ leagueId: string; draftId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { leagueId, draftId } = await context.params;
  return proxyDraftSaveBackendRequest(
    request,
    `/api/leagues/${leagueId}/drafts/${draftId}/copy`,
  );
}
