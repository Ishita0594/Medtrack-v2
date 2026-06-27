import { UserRole } from './enums/user-role.enum';

export interface UserRecord {
  PK: string;
  SK?: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash?: string;
  refreshTokenHash?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
}
