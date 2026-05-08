import { requireAuthenticatedUser } from '@/features/Auth/server/require-auth';
import DraftPage from '@/features/Draft/draftpage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAuthenticatedUser('/draft');
  return <DraftPage />;
}
