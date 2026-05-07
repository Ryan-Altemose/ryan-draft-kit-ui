import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth';

export async function requireAuthenticatedUser(callbackUrl: string) {
  const session = await getAuthSession();

  if (!session?.user?.backendUserId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session.user;
}
