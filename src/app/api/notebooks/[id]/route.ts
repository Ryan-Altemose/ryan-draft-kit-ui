import { proxyBackendRequest } from '@/shared/server/backend-proxy';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackendRequest(request, `/api/notebooks/${id}`);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackendRequest(request, `/api/notebooks/${id}`);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackendRequest(request, `/api/notebooks/${id}`);
}
