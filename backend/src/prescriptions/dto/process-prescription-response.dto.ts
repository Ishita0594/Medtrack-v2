import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrescriptionStatus } from '../enums/prescription-status.enum';
import { ParsedMedicationDto } from './parsed-medication.dto';

export class ProcessPrescriptionResponseDto {
  @ApiProperty({ example: '01972ea0-e9bf-7707-bc34-f957a2aae522' })
  prescriptionId: string;

  @ApiProperty({
    enum: PrescriptionStatus,
    example: PrescriptionStatus.PROCESSED,
  })
  status: PrescriptionStatus;

  @ApiProperty({ example: 'Tab Paracetamol 500mg twice daily...' })
  ocrText: string;

  @ApiProperty({ type: [ParsedMedicationDto] })
  medications: ParsedMedicationDto[];

  @ApiProperty({ type: [String] })
  createdMedicationIds: string[];

  @ApiPropertyOptional({ example: 1782000300000 })
  processedAt?: number;
}
