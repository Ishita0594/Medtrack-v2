import { AdherenceRecord } from '../adherence.interface';
import { AdherenceStatus } from '../enums/adherence-status.enum';

export const ADHERENCE_REPOSITORY = Symbol('ADHERENCE_REPOSITORY');

export interface CreateAdherenceRecordInput {
  recordId: string;
  userId: string;
  medicationId: string;
  scheduledAt: number;
  takenAt?: number;
  status: AdherenceStatus;
  notes?: string;
  dateKey: string;
}

export interface UpdateAdherenceRecordInput {
  status?: AdherenceStatus;
  takenAt?: number;
  notes?: string;
  clearTakenAt?: boolean;
}

export interface AdherenceRepository {
  create(input: CreateAdherenceRecordInput): Promise<AdherenceRecord>;
  findAllByUserId(userId: string): Promise<AdherenceRecord[]>;
  findById(userId: string, recordId: string): Promise<AdherenceRecord | null>;
  update(
    userId: string,
    recordId: string,
    input: UpdateAdherenceRecordInput,
  ): Promise<AdherenceRecord | null>;
  delete(userId: string, recordId: string): Promise<boolean>;
}
