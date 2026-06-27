import { UserResponseDto } from './dto/user-response.dto';
import { UserRecord } from './users.types';

export class UserMapper {
  static toResponse(user: UserRecord): UserResponseDto {
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponseList(users: UserRecord[]): UserResponseDto[] {
    return users.map((user) => this.toResponse(user));
  }
}
