import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class UserResponseDto {
  @ApiProperty({
    example: '018f6b90-5d7d-7c2a-bf2c-5c68d7d4b7f0',
    description: 'Public user identifier',
  })
  userId: string;

  @ApiProperty({
    example: 'Aarav Sharma',
    description: 'Full name of the user',
  })
  name: string;

  @ApiProperty({
    example: 'aarav.sharma@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Contact phone number in international format',
  })
  phone: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PATIENT,
    description: 'Application role assigned to the user',
  })
  role: UserRole;

  @ApiProperty({
    example: true,
    description: 'Whether the user account is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the user email has been verified',
  })
  emailVerified: boolean;

  @ApiProperty({
    example: 1719235200000,
    description: 'Creation timestamp as epoch milliseconds',
  })
  createdAt: number;

  @ApiProperty({
    example: 1719235200000,
    description: 'Last update timestamp as epoch milliseconds',
  })
  updatedAt: number;
}
