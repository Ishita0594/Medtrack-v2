import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/dto/create-user.dto';

export class RegisterDto {
  @ApiProperty({
    example: 'Aarav Sharma',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'aarav.sharma@example.com',
    description: 'Unique email address used for login',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Contact phone number in international format',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PATIENT,
    description: 'Application role assigned to the user',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: 'StrongPass123!',
    minLength: 8,
    description: 'Password used for account login',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
