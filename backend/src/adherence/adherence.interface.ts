import { AdherenceStatus } from './enums/adherence-status.enum';

export interface AdherenceRecord {
  recordId: string;
  userId: string;
  medicationId: string;
  scheduledAt: number;
  takenAt?: number;
  status: AdherenceStatus;
  notes?: string;
  dateKey: string;
  createdAt: number;
  updatedAt: number;
}
