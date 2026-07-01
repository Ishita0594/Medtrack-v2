import { MedicationFrequency } from '../enums/medication-frequency.enum';
import { Medication } from '../medication.interface';

export const MEDICATION_REPOSITORY = Symbol('MEDICATION_REPOSITORY');

export interface CreateMedicationRecordInput {
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
}

export interface UpdateMedicationRecordInput {
  name?: string;
  dosage?: string;
  frequency?: MedicationFrequency;
  times?: string[];
  startDate?: number;
  endDate?: number;
  instructions?: string;
  isActive?: boolean;
}

export interface MedicationRepository {
  create(input: CreateMedicationRecordInput): Promise<Medication>;
  findAllByUserId(userId: string): Promise<Medication[]>;
  findById(userId: string, medicationId: string): Promise<Medication | null>;
  update(
    userId: string,
    medicationId: string,
    input: UpdateMedicationRecordInput,
  ): Promise<Medication | null>;
  delete(userId: string, medicationId: string): Promise<boolean>;
}
