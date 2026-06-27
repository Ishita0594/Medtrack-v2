import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    example: 'Aarav Sharma',
    description: 'Updated full name of the user',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  declare name?: string;

  @ApiPropertyOptional({
    example: 'aarav.sharma@example.com',
    description: 'Updated email address for the user',
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  declare email?: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Updated contact phone number in international format',
  })
  @IsOptional()
  @IsPhoneNumber()
  @Transform(({ value }: { value: string }) => value?.trim())
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
