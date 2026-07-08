export type CaregiverRelationshipStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED';

export type CaregiverRelationshipType =
  | 'PARENT'
  | 'CHILD'
  | 'SPOUSE'
  | 'SIBLING'
  | 'DOCTOR'
  | 'FRIEND'
  | 'OTHER';

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

export interface CaregiverInvitePayload {
  caregiverEmail: string;
  caregiverName?: string;
  relationshipType: CaregiverRelationshipType;
}
