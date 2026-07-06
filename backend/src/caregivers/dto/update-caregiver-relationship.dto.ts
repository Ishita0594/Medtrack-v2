import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CaregiverRelationshipType } from '../enums/caregiver-relationship-type.enum';

export class UpdateCaregiverRelationshipDto {
  @ApiPropertyOptional({ example: 'Mother' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  caregiverName?: string;

  @ApiPropertyOptional({ enum: CaregiverRelationshipType })
  @IsOptional()
  @IsEnum(CaregiverRelationshipType)
  relationshipType?: CaregiverRelationshipType;
}
