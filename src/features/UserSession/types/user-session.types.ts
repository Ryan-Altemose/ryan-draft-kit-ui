export type CurrentUser = {
  userId: string;
  provider: 'google';
  providerSubject: string;
  name: string;
  email: string;
  image?: string | null;
};

export type UserSessionStatus =
  | 'initializing'
  | 'ready'
  | 'error'
  | 'unauthenticated';
