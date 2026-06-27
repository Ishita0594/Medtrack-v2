import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
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
    description: 'Unique email address for the user',
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
}
