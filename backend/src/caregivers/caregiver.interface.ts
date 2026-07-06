import { CaregiverRelationshipStatus } from './enums/caregiver-relationship-status.enum';
import { CaregiverRelationshipType } from './enums/caregiver-relationship-type.enum';

export interface CaregiverRelationship {
  relationshipId: string;
  patientId: string;
  caregiverId?: string;
  caregiverEmail: string;
  caregiverName?: string;
  relationshipType: CaregiverRelationshipType;
  status: CaregiverRelationshipStatus;
  invitedAt: number;
  acceptedAt?: number;
  rejectedAt?: number;
  cancelledAt?: number;
  createdAt: number;
  updatedAt: number;
}
