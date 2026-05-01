export type UserProfile = {
  _id: string;
  name: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileResponse = {
  success: boolean;
  data: UserProfile;
};
