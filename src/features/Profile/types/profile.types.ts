export type UserProfile = {
  _id: string;
  name: string;
  email?: string;
  authProvider?: 'google';
  providerSubject?: string;
  avatarUrl?: string | null;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileResponse = {
  success: boolean;
  data: UserProfile;
};
