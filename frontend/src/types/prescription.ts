import type { MedicationFrequency } from './medication';

export type PrescriptionStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type PrescriptionFileType = 'IMAGE' | 'PDF';
export type PrescriptionStorageProvider = 'LOCAL' | 'S3';

export interface ParsedMedication {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  durationDays: number;
  instructions?: string;
}

export interface Prescription {
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
  errorMessage?: string;
  createdMedicationIds?: string[];
  createdAt: number;
  updatedAt: number;
  processedAt?: number;
}

export interface ProcessPrescriptionResponse {
  prescriptionId: string;
  status: PrescriptionStatus;
  ocrText: string;
  medications: ParsedMedication[];
  createdMedicationIds: string[];
  processedAt?: number;
}
