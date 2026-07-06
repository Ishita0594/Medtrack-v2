import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrescriptionFileType } from '../enums/prescription-file-type.enum';
import { PrescriptionStatus } from '../enums/prescription-status.enum';
import { PrescriptionStorageProvider } from '../enums/prescription-storage-provider.enum';

export class PrescriptionResponseDto {
  @ApiProperty({ example: '01972ea0-e9bf-7707-bc34-f957a2aae522' })
  prescriptionId: string;

  @ApiProperty({ example: '01972e10-49bb-73d4-a8d3-01cc389342f2' })
  userId: string;

  @ApiProperty({ example: 'prescription.pdf' })
  originalFileName: string;

  @ApiProperty({
    enum: PrescriptionFileType,
    example: PrescriptionFileType.PDF,
  })
  fileType: PrescriptionFileType;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 245760 })
  fileSize: number;

  @ApiProperty({
    enum: PrescriptionStorageProvider,
    example: PrescriptionStorageProvider.LOCAL,
  })
  storageProvider: PrescriptionStorageProvider;

  @ApiProperty({ example: 'user-id/prescription-id/prescription.pdf' })
  storageKey: string;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiProperty({
    enum: PrescriptionStatus,
    example: PrescriptionStatus.UPLOADED,
  })
  status: PrescriptionStatus;

  @ApiPropertyOptional({ example: 'Prescription processing failed' })
  errorMessage?: string;

  @ApiPropertyOptional({ type: [String] })
  createdMedicationIds?: string[];

  @ApiProperty({ example: 1782000000000 })
  createdAt: number;

  @ApiProperty({ example: 1782000000000 })
  updatedAt: number;

  @ApiPropertyOptional({ example: 1782000300000 })
  processedAt?: number;
}
