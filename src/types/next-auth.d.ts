import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      backendUserId: string;
      provider: 'google';
      providerSubject: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendUserId?: string;
    provider?: 'google';
    providerSubject?: string;
  }
}
