import { requireAuthenticatedUser } from '@/features/Auth/server/require-auth';
import ProfilePage from '@/features/Profile/profilepage';

export default async function Page() {
  await requireAuthenticatedUser('/profile');
  return <ProfilePage />;
}
