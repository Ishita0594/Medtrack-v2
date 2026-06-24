import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
  PK: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'PATIENT' | 'CAREGIVER';
  createdAt: number;
  updatedAt: number;
}

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto): User {
    const userId = this.generateUserId();
    const now = Date.now();

    return {
      PK: this.buildPrimaryKey(userId),
      userId,
      ...createUserDto,
      createdAt: now,
      updatedAt: now,
    };
  }

  findAll(): User[] {
    return [];
  }

  findOne(userId: string): User {
    const now = Date.now();

    return {
      PK: this.buildPrimaryKey(userId),
      userId,
      name: 'Sample User',
      email: 'sample.user@example.com',
      phone: '+919876543210',
      role: 'PATIENT',
      createdAt: now,
      updatedAt: now,
    };
  }

  update(userId: string, updateUserDto: UpdateUserDto): User {
    const existingUser = this.findOne(userId);

    return {
      ...existingUser,
      ...updateUserDto,
      updatedAt: Date.now(),
    };
  }

  private buildPrimaryKey(userId: string): string {
    return `USER#${userId}`;
  }

  private generateUserId(): string {
    return `usr_${Date.now()}`;
  }
}
