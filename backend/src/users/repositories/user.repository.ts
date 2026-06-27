import { UserRecord } from '../users.types';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserRecordInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRecord['role'];
  passwordHash?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UpdateUserRecordInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRecord['role'];
  isActive?: boolean;
  emailVerified?: boolean;
  passwordHash?: string;
}

export interface UserRepository {
  create(input: CreateUserRecordInput): Promise<UserRecord>;
  findById(userId: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  update(
    userId: string,
    input: UpdateUserRecordInput,
  ): Promise<UserRecord | null>;
  delete(userId: string): Promise<void>;
  list(): Promise<UserRecord[]>;
}
