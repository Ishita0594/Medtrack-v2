import { PrescriptionStorageProvider } from '../enums/prescription-storage-provider.enum';

export const PRESCRIPTION_STORAGE = Symbol('PRESCRIPTION_STORAGE');

export interface StoredPrescriptionFile {
  storageProvider: PrescriptionStorageProvider;
  storageKey: string;
  fileUrl?: string;
}

export interface PrescriptionStorage {
  store(
    userId: string,
    prescriptionId: string,
    file: Express.Multer.File,
  ): Promise<StoredPrescriptionFile>;
  delete(storageKey: string): Promise<void>;
}
