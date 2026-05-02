export type CurrentUser = {
  userId: string;
  externalId: string;
  name: string;
};

export type UserSessionStatus = 'initializing' | 'ready' | 'error';
