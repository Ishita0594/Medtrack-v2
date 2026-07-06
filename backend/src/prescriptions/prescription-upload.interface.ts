import { ParsedMedication } from './parsed-medication.interface';
import { PrescriptionFileType } from './enums/prescription-file-type.enum';
import { PrescriptionStatus } from './enums/prescription-status.enum';
import { PrescriptionStorageProvider } from './enums/prescription-storage-provider.enum';

export interface PrescriptionUpload {
  prescriptionId: string;
  userId: string;
  originalFileName: string;
  fileType: PrescriptionFileType;
  mimeType: string;
  fileSize: number;
  storageProvider: PrescriptionStorageProvider;
  storageKey: string;
  fileUrl?: string;
  ocrText?: string;
  aiParsedMedications?: ParsedMedication[];
  createdMedicationIds?: string[];
  status: PrescriptionStatus;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
  processedAt?: number;
}
