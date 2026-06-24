import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export enum UserRole {
  PATIENT = 'PATIENT',
  CAREGIVER = 'CAREGIVER',
}

export class CreateUserDto {
  @ApiProperty({
    example: 'Aarav Sharma',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'aarav.sharma@example.com',
    description: 'Unique email address for the user',
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
}
