import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CaregiverRelationshipType } from '../enums/caregiver-relationship-type.enum';

export class CreateCaregiverInviteDto {
  @ApiProperty({ example: 'mother@test.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  caregiverEmail: string;

  @ApiPropertyOptional({ example: 'Mother' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  caregiverName?: string;

  @ApiProperty({
    enum: CaregiverRelationshipType,
    example: CaregiverRelationshipType.PARENT,
  })
  @IsEnum(CaregiverRelationshipType)
  relationshipType: CaregiverRelationshipType;
}
