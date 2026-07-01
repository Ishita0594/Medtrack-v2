import { UserRole } from './enums/user-role.enum';

export interface UserRecord {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
}
