import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CaregiverRelationshipStatus } from '../enums/caregiver-relationship-status.enum';
import { CaregiverRelationshipType } from '../enums/caregiver-relationship-type.enum';

export class CaregiverResponseDto {
  @ApiProperty({ example: '01972e80-3c69-7dc2-aa09-4e5eefc421c4' })
  relationshipId: string;

  @ApiProperty({ example: '01972e10-49bb-73d4-a8d3-01cc389342f2' })
  patientId: string;

  @ApiPropertyOptional({ example: '01972e70-0c53-7021-9d77-f8a12d3267db' })
  caregiverId?: string;

  @ApiProperty({ example: 'mother@test.com' })
  caregiverEmail: string;

  @ApiPropertyOptional({ example: 'Mother' })
  caregiverName?: string;

  @ApiProperty({
    enum: CaregiverRelationshipType,
    example: CaregiverRelationshipType.PARENT,
  })
  relationshipType: CaregiverRelationshipType;

  @ApiProperty({
    enum: CaregiverRelationshipStatus,
    example: CaregiverRelationshipStatus.PENDING,
  })
  status: CaregiverRelationshipStatus;

  @ApiProperty({ example: 1782000000000 })
  invitedAt: number;

  @ApiPropertyOptional({ example: 1782000300000 })
  acceptedAt?: number;

  @ApiPropertyOptional({ example: 1782000300000 })
  rejectedAt?: number;

  @ApiPropertyOptional({ example: 1782000300000 })
  cancelledAt?: number;

  @ApiProperty({ example: 1782000000000 })
  createdAt: number;

  @ApiProperty({ example: 1782000000000 })
  updatedAt: number;
}
