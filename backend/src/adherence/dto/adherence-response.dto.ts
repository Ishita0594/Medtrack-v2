import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdherenceStatus } from '../enums/adherence-status.enum';

export class AdherenceResponseDto {
  @ApiProperty({ example: '01972e40-5978-74e6-b5b7-a5d2441796a8' })
  recordId: string;

  @ApiProperty({ example: '01972e10-49bb-73d4-a8d3-01cc389342f2' })
  userId: string;

  @ApiProperty({ example: '01972e26-4d7a-7f47-a38e-04dd8a0fb731' })
  medicationId: string;

  @ApiProperty({ example: 1782400000000 })
  scheduledAt: number;

  @ApiPropertyOptional({ example: 1782400300000 })
  takenAt?: number;

  @ApiProperty({ enum: AdherenceStatus, example: AdherenceStatus.TAKEN })
  status: AdherenceStatus;

  @ApiPropertyOptional({ example: 'Taken after breakfast' })
  notes?: string;

  @ApiProperty({ example: '2026-06-25' })
  dateKey: string;

  @ApiProperty({ example: 1782000000000 })
  createdAt: number;

  @ApiProperty({ example: 1782000000000 })
  updatedAt: number;
}
