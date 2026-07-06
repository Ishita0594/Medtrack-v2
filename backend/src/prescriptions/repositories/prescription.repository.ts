import { ParsedMedication } from '../parsed-medication.interface';
import { PrescriptionFileType } from '../enums/prescription-file-type.enum';
import { PrescriptionStatus } from '../enums/prescription-status.enum';
import { PrescriptionStorageProvider } from '../enums/prescription-storage-provider.enum';
import { PrescriptionUpload } from '../prescription-upload.interface';

export const PRESCRIPTION_REPOSITORY = Symbol('PRESCRIPTION_REPOSITORY');

export interface CreatePrescriptionInput {
  prescriptionId: string;
  userId: string;
  originalFileName: string;
  fileType: PrescriptionFileType;
  mimeType: string;
  fileSize: number;
  storageProvider: PrescriptionStorageProvider;
  storageKey: string;
  fileUrl?: string;
  status: PrescriptionStatus;
}

export interface UpdatePrescriptionInput {
  status?: PrescriptionStatus;
  ocrText?: string;
  aiParsedMedications?: ParsedMedication[];
  createdMedicationIds?: string[];
  errorMessage?: string;
  processedAt?: number;
  clearErrorMessage?: boolean;
  expectedStatus?: PrescriptionStatus;
}

export interface PrescriptionRepository {
  create(input: CreatePrescriptionInput): Promise<PrescriptionUpload>;
  findAllByUserId(userId: string): Promise<PrescriptionUpload[]>;
  findById(
    userId: string,
    prescriptionId: string,
  ): Promise<PrescriptionUpload | null>;
  update(
    userId: string,
    prescriptionId: string,
    input: UpdatePrescriptionInput,
  ): Promise<PrescriptionUpload | null>;
  delete(userId: string, prescriptionId: string): Promise<boolean>;
}
