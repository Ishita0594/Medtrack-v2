import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { AdherenceService } from '../adherence/adherence.service';
import { AdherenceResponseDto } from '../adherence/dto/adherence-response.dto';
import { MedicationsService } from '../medications/medications.service';
import { MedicationResponseDto } from '../medications/dto/medication-response.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/enums/user-role.enum';
import { CaregiverRelationship } from './caregiver.interface';
import { CaregiverMapper } from './caregiver.mapper';
import { CaregiverQueryDto } from './dto/caregiver-query.dto';
import { CaregiverResponseDto } from './dto/caregiver-response.dto';
import { CreateCaregiverInviteDto } from './dto/create-caregiver-invite.dto';
import { UpdateCaregiverRelationshipDto } from './dto/update-caregiver-relationship.dto';
import { CaregiverRelationshipStatus } from './enums/caregiver-relationship-status.enum';
import { CaregiverAccessDeniedException } from './exceptions/caregiver-access-denied.exception';
import { CaregiverInviteAlreadyExistsException } from './exceptions/caregiver-invite-already-exists.exception';
import { CaregiverRelationshipNotFoundException } from './exceptions/caregiver-relationship-not-found.exception';
import { InvalidCaregiverStatusTransitionException } from './exceptions/invalid-caregiver-status-transition.exception';
import { CAREGIVER_REPOSITORY } from './repositories/caregiver.repository';
import type {
  CaregiverRepository,
  UpdateCaregiverRelationshipInput,
} from './repositories/caregiver.repository';

@Injectable()
export class CaregiversService {
  constructor(
    @Inject(CAREGIVER_REPOSITORY)
    private readonly caregiverRepository: CaregiverRepository,
    private readonly medicationsService: MedicationsService,
    private readonly adherenceService: AdherenceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async invite(
    patientId: string,
    role: string,
    input: CreateCaregiverInviteDto,
  ): Promise<CaregiverResponseDto> {
    this.assertRole(role, UserRole.PATIENT);
    const caregiverEmail = this.normalizeEmail(input.caregiverEmail);
    const relationships =
      await this.caregiverRepository.findAllByPatientId(patientId);
    const duplicate = relationships.some(
      (relationship) =>
        relationship.caregiverEmail === caregiverEmail &&
        relationship.status === CaregiverRelationshipStatus.PENDING,
    );

    if (duplicate) {
      throw new CaregiverInviteAlreadyExistsException();
    }

    const now = Date.now();
    const relationship = await this.caregiverRepository.create({
      relationshipId: uuidv7(),
      patientId,
      caregiverEmail,
      caregiverName: input.caregiverName,
      relationshipType: input.relationshipType,
      status: CaregiverRelationshipStatus.PENDING,
      invitedAt: now,
    });

    await this.notificationsService.sendCaregiverInvite(relationship);

    return CaregiverMapper.toResponse(relationship);
  }

  async findAll(
    patientId: string,
    role: string,
    query: CaregiverQueryDto,
  ): Promise<CaregiverResponseDto[]> {
    this.assertRole(role, UserRole.PATIENT);
    const relationships =
      await this.caregiverRepository.findAllByPatientId(patientId);
    const filtered = relationships.filter(
      (relationship) =>
        (!query.status || relationship.status === query.status) &&
        (!query.relationshipType ||
          relationship.relationshipType === query.relationshipType),
    );

    return CaregiverMapper.toResponseList(filtered);
  }

  async findOne(
    patientId: string,
    role: string,
    relationshipId: string,
  ): Promise<CaregiverResponseDto> {
    this.assertRole(role, UserRole.PATIENT);
    const relationship = await this.getPatientRelationship(
      patientId,
      relationshipId,
    );

    return CaregiverMapper.toResponse(relationship);
  }

  async update(
    patientId: string,
    role: string,
    relationshipId: string,
    input: UpdateCaregiverRelationshipDto,
  ): Promise<CaregiverResponseDto> {
    this.assertRole(role, UserRole.PATIENT);
    await this.getPatientRelationship(patientId, relationshipId);
    const updated = await this.caregiverRepository.update(
      patientId,
      relationshipId,
      input,
    );

    if (!updated) {
      throw new CaregiverRelationshipNotFoundException();
    }

    return CaregiverMapper.toResponse(updated);
  }

  async accept(
    caregiverId: string,
    caregiverEmail: string,
    role: string,
    relationshipId: string,
  ): Promise<CaregiverResponseDto> {
    this.assertRole(role, UserRole.CAREGIVER);
    const relationship = await this.getCaregiverInvite(
      caregiverEmail,
      relationshipId,
    );
    const updated = await this.transitionPending(
      relationship,
      CaregiverRelationshipStatus.ACCEPTED,
      {
        caregiverId,
        acceptedAt: Date.now(),
      },
    );

    return CaregiverMapper.toResponse(updated);
  }

  async reject(
    caregiverEmail: string,
    role: string,
    relationshipId: string,
  ): Promise<CaregiverResponseDto> {
    this.assertRole(role, UserRole.CAREGIVER);
    const relationship = await this.getCaregiverInvite(
      caregiverEmail,
      relationshipId,
    );
    const updated = await this.transitionPending(
      relationship,
      CaregiverRelationshipStatus.REJECTED,
      {
        rejectedAt: Date.now(),
      },
    );

    return CaregiverMapper.toResponse(updated);
  }

  async cancel(
    patientId: string,
    role: string,
    relationshipId: string,
  ): Promise<CaregiverResponseDto> {
    this.assertRole(role, UserRole.PATIENT);
    const relationship = await this.getPatientRelationship(
      patientId,
      relationshipId,
    );
    const updated = await this.transitionPending(
      relationship,
      CaregiverRelationshipStatus.CANCELLED,
      {
        cancelledAt: Date.now(),
      },
    );

    return CaregiverMapper.toResponse(updated);
  }

  async remove(
    patientId: string,
    role: string,
    relationshipId: string,
  ): Promise<{ message: string }> {
    this.assertRole(role, UserRole.PATIENT);
    const deleted = await this.caregiverRepository.delete(
      patientId,
      relationshipId,
    );

    if (!deleted) {
      throw new CaregiverRelationshipNotFoundException();
    }

    return { message: 'Caregiver relationship deleted successfully' };
  }

  async findPatients(
    caregiverId: string,
    role: string,
  ): Promise<CaregiverResponseDto[]> {
    this.assertRole(role, UserRole.CAREGIVER);
    const relationships =
      await this.caregiverRepository.findAllByCaregiverId(caregiverId);

    return CaregiverMapper.toResponseList(
      relationships.filter(
        (relationship) =>
          relationship.status === CaregiverRelationshipStatus.ACCEPTED,
      ),
    );
  }

  async findPatientMedications(
    caregiverId: string,
    role: string,
    patientId: string,
  ): Promise<MedicationResponseDto[]> {
    await this.assertAcceptedAccess(caregiverId, role, patientId);

    return this.medicationsService.findAll(patientId);
  }

  async findPatientAdherence(
    caregiverId: string,
    role: string,
    patientId: string,
  ): Promise<AdherenceResponseDto[]> {
    await this.assertAcceptedAccess(caregiverId, role, patientId);

    return this.adherenceService.findAll(patientId, {});
  }

  private async transitionPending(
    relationship: CaregiverRelationship,
    targetStatus: CaregiverRelationshipStatus,
    fields: UpdateCaregiverRelationshipInput,
  ): Promise<CaregiverRelationship> {
    if (relationship.status !== CaregiverRelationshipStatus.PENDING) {
      throw new InvalidCaregiverStatusTransitionException(
        relationship.status,
        targetStatus,
      );
    }

    const updated = await this.caregiverRepository.update(
      relationship.patientId,
      relationship.relationshipId,
      {
        ...fields,
        status: targetStatus,
        expectedStatus: CaregiverRelationshipStatus.PENDING,
      },
    );

    if (!updated) {
      throw new InvalidCaregiverStatusTransitionException(
        relationship.status,
        targetStatus,
      );
    }

    return updated;
  }

  private async assertAcceptedAccess(
    caregiverId: string,
    role: string,
    patientId: string,
  ): Promise<void> {
    this.assertRole(role, UserRole.CAREGIVER);
    const relationships =
      await this.caregiverRepository.findAllByCaregiverId(caregiverId);
    const accepted = relationships.some(
      (relationship) =>
        relationship.patientId === patientId &&
        relationship.status === CaregiverRelationshipStatus.ACCEPTED,
    );

    if (!accepted) {
      throw new CaregiverAccessDeniedException();
    }
  }

  private async getPatientRelationship(
    patientId: string,
    relationshipId: string,
  ): Promise<CaregiverRelationship> {
    const relationship = await this.caregiverRepository.findByPatientAndId(
      patientId,
      relationshipId,
    );

    if (!relationship) {
      throw new CaregiverRelationshipNotFoundException();
    }

    return relationship;
  }

  private async getCaregiverInvite(
    caregiverEmail: string,
    relationshipId: string,
  ): Promise<CaregiverRelationship> {
    const relationship = await this.caregiverRepository.findByInviteEmailAndId(
      this.normalizeEmail(caregiverEmail),
      relationshipId,
    );

    if (!relationship) {
      throw new CaregiverAccessDeniedException();
    }

    return relationship;
  }

  private assertRole(actualRole: string, requiredRole: UserRole): void {
    if (actualRole !== requiredRole) {
      throw new CaregiverAccessDeniedException();
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
