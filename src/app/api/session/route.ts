import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';

export async function GET() {
  const session = await getAuthSession();
  const user = session?.user;

  if (!user?.backendUserId) {
    return NextResponse.json({
      success: true,
      authenticated: false,
      data: null,
    });
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    data: {
      userId: user.backendUserId,
      provider: user.provider,
      providerSubject: user.providerSubject,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    },
  });
}
