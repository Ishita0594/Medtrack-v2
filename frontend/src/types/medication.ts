export type MedicationFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

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

export interface MedicationPayload {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  startDate: number;
  endDate?: number;
  instructions?: string;
}
