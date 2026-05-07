import LeagueDraftDetailPage from '@/features/Leagues/leagueDraftDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ leagueId: string; draftId: string }>;
}) {
  const { leagueId, draftId } = await params;
  return <LeagueDraftDetailPage leagueId={leagueId} draftId={draftId} />;
}
