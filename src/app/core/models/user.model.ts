export type UserRole = 'buyer' | 'creator';

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}
