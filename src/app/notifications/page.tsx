import { requireAuthenticatedUser } from '@/features/Auth/server/require-auth';
import NotificationsPage from '@/features/Notifications/notificationspage';

export default async function NotificationsRoute() {
  await requireAuthenticatedUser('/notifications');
  return <NotificationsPage />;
}
