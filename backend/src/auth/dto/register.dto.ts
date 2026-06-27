import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'Aarav Sharma',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @ApiProperty({
    example: 'aarav.sharma@example.com',
    description: 'Unique email address used for login',
  })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Contact phone number in international format',
  })
  @IsPhoneNumber()
  @Transform(({ value }: { value: string }) => value?.trim())
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'password must include uppercase, lowercase, number, and special character',
  })
  password: string;
}
