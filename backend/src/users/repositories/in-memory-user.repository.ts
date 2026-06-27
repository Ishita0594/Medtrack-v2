import { Injectable } from '@nestjs/common';
import { USER_DEFAULTS, USER_ENTITY } from '../users.constants';
import {
  CreateUserRecordInput,
  UpdateUserRecordInput,
  UserRepository,
} from './user.repository';
import { UserRecord } from '../users.types';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, UserRecord>();
  private readonly userIdsByEmail = new Map<string, string>();

  async create(input: CreateUserRecordInput): Promise<UserRecord> {
    const now = Date.now();
    const email = this.normalizeEmail(input.email);
    const user: UserRecord = {
      PK: `${USER_ENTITY}#${input.userId}`,
      SK: `${USER_ENTITY}#${input.userId}`,
      userId: input.userId,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      role: input.role,
      passwordHash: input.passwordHash,
      isActive: input.isActive ?? USER_DEFAULTS.isActive,
      emailVerified: input.emailVerified ?? USER_DEFAULTS.emailVerified,
      createdAt: now,
      updatedAt: now,
    };

    this.usersById.set(user.userId, user);
    this.userIdsByEmail.set(email, user.userId);

    return user;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    return this.usersById.get(userId) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const userId = this.userIdsByEmail.get(this.normalizeEmail(email));

    if (!userId) {
      return null;
    }

    return this.findById(userId);
  }

  async update(
    userId: string,
    input: UpdateUserRecordInput,
  ): Promise<UserRecord | null> {
    const existingUser = await this.findById(userId);

    if (!existingUser) {
      return null;
    }

    const nextEmail = input.email
      ? this.normalizeEmail(input.email)
      : existingUser.email;
    const updatedUser: UserRecord = {
      ...existingUser,
      ...input,
      name: input.name?.trim() ?? existingUser.name,
      email: nextEmail,
      phone: input.phone?.trim() ?? existingUser.phone,
      updatedAt: Date.now(),
    };

    if (nextEmail !== existingUser.email) {
      this.userIdsByEmail.delete(existingUser.email);
      this.userIdsByEmail.set(nextEmail, userId);
    }

    this.usersById.set(userId, updatedUser);

    return updatedUser;
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      return;
    }

    this.usersById.delete(userId);
    this.userIdsByEmail.delete(user.email);
  }

  async list(): Promise<UserRecord[]> {
    return [...this.usersById.values()];
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
