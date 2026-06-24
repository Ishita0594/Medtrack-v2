import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { CreateUserDto, UserRole } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    example: 'Aarav Sharma',
    description: 'Updated full name of the user',
  })
  @IsOptional()
  @IsString()
  declare name?: string;

  @ApiPropertyOptional({
    example: 'aarav.sharma@example.com',
    description: 'Updated email address for the user',
  })
  @IsOptional()
  @IsEmail()
  declare email?: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Updated contact phone number in international format',
  })
  @IsOptional()
  @IsPhoneNumber()
  declare phone?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.CAREGIVER,
    description: 'Updated application role assigned to the user',
  })
  @IsOptional()
  @IsEnum(UserRole)
  declare role?: UserRole;
}
