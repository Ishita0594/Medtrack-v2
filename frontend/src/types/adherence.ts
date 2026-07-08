export type AdherenceStatus = 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';

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

export interface AdherencePayload {
  medicationId: string;
  scheduledAt: number;
  status: AdherenceStatus;
  takenAt?: number;
  notes?: string;
}

export interface AdherenceStats {
  totalRecords: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  pendingCount: number;
  adherenceRate: number;
}
