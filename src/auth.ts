import { getServerSession, type NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';

type BackendUserResponse = {
  success: boolean;
  data?: {
    _id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  };
  message?: string;
};

function getBackendUrl(): string {
  const backendUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error('BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is required');
  }

  return backendUrl.replace(/\/+$/, '');
}

function getBackendInternalAuthSecret(): string {
  const secret = process.env.BACKEND_INTERNAL_AUTH_SECRET;

  if (!secret) {
    throw new Error('BACKEND_INTERNAL_AUTH_SECRET is required');
  }

  return secret;
}

async function syncBackendUser(input: {
  providerSubject: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}) {
  const response = await fetch(`${getBackendUrl()}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Auth-Secret': getBackendInternalAuthSecret(),
    },
    body: JSON.stringify({
      authProvider: 'google',
      providerSubject: input.providerSubject,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl ?? null,
    }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as BackendUserResponse;

  if (!response.ok || !payload.data?._id) {
    throw new Error(payload.message || 'Unable to sync backend user');
  }

  return payload.data;
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      const profileRecord =
        profile && typeof profile === 'object'
          ? (profile as Record<string, unknown>)
          : null;
      const provider = account?.provider ?? token.provider;
      const providerSubject =
        account?.providerAccountId ??
        (typeof token.providerSubject === 'string'
          ? token.providerSubject
          : undefined);

      if (provider !== 'google' || !providerSubject) {
        return token;
      }

      const email = token.email;

      if (!email) {
        throw new Error('Google account is missing an email address');
      }

      token.provider = 'google';
      token.providerSubject = providerSubject;

      if (!account && token.backendUserId) {
        return token;
      }

      const backendUser = await syncBackendUser({
        providerSubject,
        email,
        name:
          token.name ||
          (typeof profileRecord?.name === 'string'
            ? profileRecord.name
            : email),
        avatarUrl:
          typeof token.picture === 'string'
            ? token.picture
            : typeof profileRecord?.picture === 'string'
              ? profileRecord.picture
              : null,
      });

      token.backendUserId = backendUser._id;
      token.name = backendUser.name;
      token.email = backendUser.email ?? email;
      token.picture = backendUser.avatarUrl ?? token.picture;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.backendUserId ?? '';
        session.user.backendUserId = token.backendUserId ?? '';
        session.user.provider = 'google';
        session.user.providerSubject =
          typeof token.providerSubject === 'string'
            ? token.providerSubject
            : '';
        session.user.email = session.user.email ?? token.email ?? '';
        session.user.name = session.user.name ?? token.name ?? '';
        session.user.image =
          session.user.image ??
          (typeof token.picture === 'string' ? token.picture : null);
      }

      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
