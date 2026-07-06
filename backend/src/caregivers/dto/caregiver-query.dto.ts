import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CaregiverRelationshipStatus } from '../enums/caregiver-relationship-status.enum';
import { CaregiverRelationshipType } from '../enums/caregiver-relationship-type.enum';

export class CaregiverQueryDto {
  @ApiPropertyOptional({ enum: CaregiverRelationshipStatus })
  @IsOptional()
  @IsEnum(CaregiverRelationshipStatus)
  status?: CaregiverRelationshipStatus;

  @ApiPropertyOptional({ enum: CaregiverRelationshipType })
  @IsOptional()
  @IsEnum(CaregiverRelationshipType)
  relationshipType?: CaregiverRelationshipType;
}
