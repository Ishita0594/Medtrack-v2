jest.mock('uuid', () => ({
  v7: jest.fn(() => '01972e80-3c69-7dc2-aa09-4e5eefc421c4'),
}));

import { AdherenceService } from '../adherence/adherence.service';
import { MedicationsService } from '../medications/medications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/enums/user-role.enum';
import { CaregiverRelationship } from './caregiver.interface';
import { CaregiversService } from './caregivers.service';
import { CaregiverRelationshipStatus } from './enums/caregiver-relationship-status.enum';
import { CaregiverRelationshipType } from './enums/caregiver-relationship-type.enum';
import { CaregiverAccessDeniedException } from './exceptions/caregiver-access-denied.exception';
import { CaregiverInviteAlreadyExistsException } from './exceptions/caregiver-invite-already-exists.exception';
import type { CaregiverRepository } from './repositories/caregiver.repository';

describe('CaregiversService', () => {
  const patientId = 'patient-id';
  const caregiverId = 'caregiver-id';
  const relationshipId = '01972e80-3c69-7dc2-aa09-4e5eefc421c4';
  const caregiverEmail = 'mother@test.com';
  const pendingRelationship: CaregiverRelationship = {
    relationshipId,
    patientId,
    caregiverEmail,
    caregiverName: 'Mother',
    relationshipType: CaregiverRelationshipType.PARENT,
    status: CaregiverRelationshipStatus.PENDING,
    invitedAt: 1782000000000,
    createdAt: 1782000000000,
    updatedAt: 1782000000000,
  };
  let repository: jest.Mocked<CaregiverRepository>;
  let medicationsService: jest.Mocked<Pick<MedicationsService, 'findAll'>>;
  let adherenceService: jest.Mocked<Pick<AdherenceService, 'findAll'>>;
  let notificationsService: jest.Mocked<
    Pick<NotificationsService, 'sendCaregiverInvite'>
  >;
  let service: CaregiversService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAllByPatientId: jest.fn(),
      findByPatientAndId: jest.fn(),
      findByInviteEmailAndId: jest.fn(),
      findAllByInviteEmail: jest.fn(),
      findAllByCaregiverId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    medicationsService = { findAll: jest.fn() };
    adherenceService = { findAll: jest.fn() };
    notificationsService = { sendCaregiverInvite: jest.fn() };
    service = new CaregiversService(
      repository,
      medicationsService as unknown as MedicationsService,
      adherenceService as unknown as AdherenceService,
      notificationsService as unknown as NotificationsService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes email and creates a pending patient invitation', async () => {
    repository.findAllByPatientId.mockResolvedValue([]);
    repository.create.mockResolvedValue(pendingRelationship);

    await service.invite(patientId, UserRole.PATIENT, {
      caregiverEmail: 'MOTHER@TEST.COM',
      caregiverName: 'Mother',
      relationshipType: CaregiverRelationshipType.PARENT,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        relationshipId,
        patientId,
        caregiverEmail,
        status: CaregiverRelationshipStatus.PENDING,
      }),
    );
    expect(notificationsService.sendCaregiverInvite).toHaveBeenCalledWith(
      pendingRelationship,
    );
  });

  it('creates an invite even when notification delivery fails', async () => {
    repository.findAllByPatientId.mockResolvedValue([]);
    repository.create.mockResolvedValue(pendingRelationship);
    notificationsService.sendCaregiverInvite.mockRejectedValue(
      new Error('smtp unavailable'),
    );

    await expect(
      service.invite(patientId, UserRole.PATIENT, {
        caregiverEmail,
        relationshipType: CaregiverRelationshipType.PARENT,
      }),
    ).resolves.toMatchObject({
      relationshipId,
      caregiverEmail,
      status: CaregiverRelationshipStatus.PENDING,
    });
  });

  it('rejects a duplicate pending invitation', async () => {
    repository.findAllByPatientId.mockResolvedValue([pendingRelationship]);

    await expect(
      service.invite(patientId, UserRole.PATIENT, {
        caregiverEmail,
        relationshipType: CaregiverRelationshipType.PARENT,
      }),
    ).rejects.toBeInstanceOf(CaregiverInviteAlreadyExistsException);
  });

  it('lets a caregiver list their pending invitations', async () => {
    repository.findAllByInviteEmail.mockResolvedValue([pendingRelationship]);

    await expect(
      service.findInvitations('MOTHER@TEST.COM', UserRole.CAREGIVER),
    ).resolves.toEqual([
      expect.objectContaining({
        relationshipId,
        caregiverEmail,
        status: CaregiverRelationshipStatus.PENDING,
      }),
    ]);

    expect(repository.findAllByInviteEmail).toHaveBeenCalledWith(caregiverEmail);
  });

  it('does not expose invitations for another caregiver email', async () => {
    repository.findAllByInviteEmail.mockResolvedValue([
      pendingRelationship,
      {
        ...pendingRelationship,
        relationshipId: 'other-relationship-id',
        caregiverEmail: 'other@test.com',
      },
    ]);

    await expect(
      service.findInvitations(caregiverEmail, UserRole.CAREGIVER),
    ).resolves.toEqual([
      expect.objectContaining({
        relationshipId,
        caregiverEmail,
      }),
    ]);
  });

  it('denies the invitation inbox to patients', async () => {
    await expect(
      service.findInvitations(caregiverEmail, UserRole.PATIENT),
    ).rejects.toBeInstanceOf(CaregiverAccessDeniedException);
    expect(repository.findAllByInviteEmail).not.toHaveBeenCalled();
  });

  it('omits accepted rejected and cancelled invitations from pending inbox', async () => {
    repository.findAllByInviteEmail.mockResolvedValue([
      pendingRelationship,
      {
        ...pendingRelationship,
        relationshipId: 'accepted-relationship-id',
        status: CaregiverRelationshipStatus.ACCEPTED,
      },
      {
        ...pendingRelationship,
        relationshipId: 'rejected-relationship-id',
        status: CaregiverRelationshipStatus.REJECTED,
      },
      {
        ...pendingRelationship,
        relationshipId: 'cancelled-relationship-id',
        status: CaregiverRelationshipStatus.CANCELLED,
      },
    ]);

    await expect(
      service.findInvitations(caregiverEmail, UserRole.CAREGIVER),
    ).resolves.toEqual([
      expect.objectContaining({
        relationshipId,
        status: CaregiverRelationshipStatus.PENDING,
      }),
    ]);
  });

  it('binds an accepted invitation to the logged-in caregiver', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1782000300000);
    repository.findByInviteEmailAndId.mockResolvedValue(pendingRelationship);
    repository.update.mockResolvedValue({
      ...pendingRelationship,
      caregiverId,
      status: CaregiverRelationshipStatus.ACCEPTED,
      acceptedAt: 1782000300000,
    });

    await service.accept(
      caregiverId,
      caregiverEmail,
      UserRole.CAREGIVER,
      relationshipId,
    );

    expect(repository.update).toHaveBeenCalledWith(
      patientId,
      relationshipId,
      expect.objectContaining({
        caregiverId,
        status: CaregiverRelationshipStatus.ACCEPTED,
        expectedStatus: CaregiverRelationshipStatus.PENDING,
      }),
    );
  });

  it('rejects an invitation from the returned relationship id', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1782000300000);
    repository.findByInviteEmailAndId.mockResolvedValue(pendingRelationship);
    repository.update.mockResolvedValue({
      ...pendingRelationship,
      status: CaregiverRelationshipStatus.REJECTED,
      rejectedAt: 1782000300000,
    });

    await expect(
      service.reject(caregiverEmail, UserRole.CAREGIVER, relationshipId),
    ).resolves.toMatchObject({
      relationshipId,
      status: CaregiverRelationshipStatus.REJECTED,
      rejectedAt: 1782000300000,
    });

    expect(repository.update).toHaveBeenCalledWith(
      patientId,
      relationshipId,
      expect.objectContaining({
        status: CaregiverRelationshipStatus.REJECTED,
        rejectedAt: 1782000300000,
        expectedStatus: CaregiverRelationshipStatus.PENDING,
      }),
    );
  });

  it('denies invite actions when the logged-in email does not match', async () => {
    repository.findByInviteEmailAndId.mockResolvedValue(null);

    await expect(
      service.accept(
        caregiverId,
        'different@test.com',
        UserRole.CAREGIVER,
        relationshipId,
      ),
    ).rejects.toBeInstanceOf(CaregiverAccessDeniedException);
  });

  it('delegates patient medications only for an accepted relationship', async () => {
    repository.findAllByCaregiverId.mockResolvedValue([
      {
        ...pendingRelationship,
        caregiverId,
        status: CaregiverRelationshipStatus.ACCEPTED,
      },
    ]);
    medicationsService.findAll.mockResolvedValue([]);

    await service.findPatientMedications(
      caregiverId,
      UserRole.CAREGIVER,
      patientId,
    );

    expect(medicationsService.findAll).toHaveBeenCalledWith(patientId);
  });

  it('denies patient data without an accepted relationship', async () => {
    repository.findAllByCaregiverId.mockResolvedValue([]);

    await expect(
      service.findPatientAdherence(caregiverId, UserRole.CAREGIVER, patientId),
    ).rejects.toBeInstanceOf(CaregiverAccessDeniedException);
  });
});
