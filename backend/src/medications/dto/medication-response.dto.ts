import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicationFrequency } from '../enums/medication-frequency.enum';

export class MedicationResponseDto {
  @ApiProperty({ example: '01972e26-4d7a-7f47-a38e-04dd8a0fb731' })
  medicationId: string;

  @ApiProperty({ example: '01972e10-49bb-73d4-a8d3-01cc389342f2' })
  userId: string;

  @ApiProperty({ example: 'Vitamin D' })
  name: string;

  @ApiProperty({ example: '500mg' })
  dosage: string;

  @ApiProperty({
    enum: MedicationFrequency,
    example: MedicationFrequency.DAILY,
  })
  frequency: MedicationFrequency;

  @ApiProperty({ example: ['08:00'], type: [String] })
  times: string[];

  @ApiProperty({ example: 1782400000000 })
  startDate: number;

  @ApiPropertyOptional({ example: 1785000000000 })
  endDate?: number;

  @ApiPropertyOptional({ example: 'Take after breakfast' })
  instructions?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1782000000000 })
  createdAt: number;

  @ApiProperty({ example: 1782000000000 })
  updatedAt: number;
}
