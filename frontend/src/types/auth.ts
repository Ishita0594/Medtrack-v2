export type UserRole = 'PATIENT' | 'CAREGIVER' | 'ADMIN';

export interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'PATIENT' | 'CAREGIVER';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}
