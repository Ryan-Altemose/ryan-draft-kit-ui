import { requireAuthenticatedUser } from '@/features/Auth/server/require-auth';
import LeaguesPage from '@/features/Leagues/leaguespage';

export default async function Page() {
  await requireAuthenticatedUser('/leagues');
  return <LeaguesPage />;
}
