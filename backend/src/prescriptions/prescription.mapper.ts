import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { ProcessPrescriptionResponseDto } from './dto/process-prescription-response.dto';
import { PrescriptionUpload } from './prescription-upload.interface';

export class PrescriptionMapper {
  static toResponse(prescription: PrescriptionUpload): PrescriptionResponseDto {
    return {
      prescriptionId: prescription.prescriptionId,
      userId: prescription.userId,
      originalFileName: prescription.originalFileName,
      fileType: prescription.fileType,
      mimeType: prescription.mimeType,
      fileSize: prescription.fileSize,
      storageProvider: prescription.storageProvider,
      storageKey: prescription.storageKey,
      fileUrl: prescription.fileUrl,
      status: prescription.status,
      errorMessage: prescription.errorMessage,
      createdMedicationIds: prescription.createdMedicationIds,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
      processedAt: prescription.processedAt,
    };
  }

  static toResponseList(
    prescriptions: PrescriptionUpload[],
  ): PrescriptionResponseDto[] {
    return prescriptions.map((prescription) => this.toResponse(prescription));
  }

  static toProcessResponse(
    prescription: PrescriptionUpload,
  ): ProcessPrescriptionResponseDto {
    return {
      prescriptionId: prescription.prescriptionId,
      status: prescription.status,
      ocrText: prescription.ocrText ?? '',
      medications: prescription.aiParsedMedications ?? [],
      createdMedicationIds: prescription.createdMedicationIds ?? [],
      processedAt: prescription.processedAt,
    };
  }
}
