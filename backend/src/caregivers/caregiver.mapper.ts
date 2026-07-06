import { CaregiverRelationship } from './caregiver.interface';
import { CaregiverResponseDto } from './dto/caregiver-response.dto';

export class CaregiverMapper {
  static toResponse(relationship: CaregiverRelationship): CaregiverResponseDto {
    return {
      relationshipId: relationship.relationshipId,
      patientId: relationship.patientId,
      caregiverId: relationship.caregiverId,
      caregiverEmail: relationship.caregiverEmail,
      caregiverName: relationship.caregiverName,
      relationshipType: relationship.relationshipType,
      status: relationship.status,
      invitedAt: relationship.invitedAt,
      acceptedAt: relationship.acceptedAt,
      rejectedAt: relationship.rejectedAt,
      cancelledAt: relationship.cancelledAt,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
    };
  }

  static toResponseList(
    relationships: CaregiverRelationship[],
  ): CaregiverResponseDto[] {
    return relationships.map((relationship) => this.toResponse(relationship));
  }
}
