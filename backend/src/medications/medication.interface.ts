import { MedicationFrequency } from './enums/medication-frequency.enum';

export interface Medication {
  medicationId: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  startDate: number;
  endDate?: number;
  instructions?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
