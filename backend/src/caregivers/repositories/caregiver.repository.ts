import { CaregiverRelationship } from '../caregiver.interface';
import { CaregiverRelationshipStatus } from '../enums/caregiver-relationship-status.enum';
import { CaregiverRelationshipType } from '../enums/caregiver-relationship-type.enum';

export const CAREGIVER_REPOSITORY = Symbol('CAREGIVER_REPOSITORY');

export interface CreateCaregiverRelationshipInput {
  relationshipId: string;
  patientId: string;
  caregiverEmail: string;
  caregiverName?: string;
  relationshipType: CaregiverRelationshipType;
  status: CaregiverRelationshipStatus;
  invitedAt: number;
}

export interface UpdateCaregiverRelationshipInput {
  caregiverId?: string;
  caregiverName?: string;
  relationshipType?: CaregiverRelationshipType;
  status?: CaregiverRelationshipStatus;
  acceptedAt?: number;
  rejectedAt?: number;
  cancelledAt?: number;
  expectedStatus?: CaregiverRelationshipStatus;
}

export interface CaregiverRepository {
  create(
    input: CreateCaregiverRelationshipInput,
  ): Promise<CaregiverRelationship>;
  findAllByPatientId(patientId: string): Promise<CaregiverRelationship[]>;
  findByPatientAndId(
    patientId: string,
    relationshipId: string,
  ): Promise<CaregiverRelationship | null>;
  findByInviteEmailAndId(
    caregiverEmail: string,
    relationshipId: string,
  ): Promise<CaregiverRelationship | null>;
  findAllByInviteEmail(caregiverEmail: string): Promise<CaregiverRelationship[]>;
  findAllByCaregiverId(caregiverId: string): Promise<CaregiverRelationship[]>;
  update(
    patientId: string,
    relationshipId: string,
    input: UpdateCaregiverRelationshipInput,
  ): Promise<CaregiverRelationship | null>;
  delete(patientId: string, relationshipId: string): Promise<boolean>;
}
