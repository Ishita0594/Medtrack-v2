jest.mock('uuid', () => ({
  v7: jest.fn(() => '01972e60-7f2c-75be-89a4-cfd939f272ce'),
}));

import { MedicationsService } from '../medications/medications.service';
import { MedicationFrequency } from '../medications/enums/medication-frequency.enum';
import { NotificationType } from '../reminders/enums/notification-type.enum';
import { ReminderStatus } from '../reminders/enums/reminder-status.enum';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { CaregiverRelationshipStatus } from '../caregivers/enums/caregiver-relationship-status.enum';
import { CaregiverRelationshipType } from '../caregivers/enums/caregiver-relationship-type.enum';
import { EmailTemplateService } from './email-template.service';
import type { NotificationProvider } from './notification-provider.interface';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const user = {
    userId: 'user-id',
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    phone: '+919876543210',
    role: UserRole.PATIENT,
    isActive: true,
    emailVerified: false,
    createdAt: 1782000000000,
    updatedAt: 1782000000000,
  };
  const medication = {
    medicationId: 'medication-id',
    userId: 'user-id',
    name: 'Vitamin D',
    dosage: '1000 IU',
    frequency: MedicationFrequency.DAILY,
    times: ['09:00'],
    startDate: 1782000000000,
    isActive: true,
    createdAt: 1782000000000,
    updatedAt: 1782000000000,
  };
  let provider: jest.Mocked<NotificationProvider>;
  let usersService: jest.Mocked<Pick<UsersService, 'findOne'>>;
  let medicationsService: jest.Mocked<Pick<MedicationsService, 'findOne'>>;
  let service: NotificationsService;

  beforeEach(() => {
    provider = {
      name: 'MOCK',
      sendEmail: jest.fn(),
    };
    usersService = {
      findOne: jest.fn().mockResolvedValue(user),
    };
    medicationsService = {
      findOne: jest.fn().mockResolvedValue(medication),
    };
    service = new NotificationsService(
      provider,
      new EmailTemplateService(),
      usersService as unknown as UsersService,
      medicationsService as unknown as MedicationsService,
    );
  });

  it('uses the configured provider for reminder email notifications', async () => {
    await expect(
      service.sendReminder({
        reminderId: 'reminder-id',
        userId: user.userId,
        medicationId: medication.medicationId,
        scheduledAt: 1782400000000,
        status: ReminderStatus.SENT,
        notificationType: NotificationType.EMAIL,
        dateKey: '2026-06-25',
        createdAt: 1782000000000,
        updatedAt: 1782000000000,
      }),
    ).resolves.toBe(true);

    expect(provider.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: 'MedTrack medication reminder',
      }),
    );
  });

  it('returns false when provider delivery fails', async () => {
    provider.sendEmail.mockRejectedValue(new Error('smtp unavailable'));

    await expect(
      service.sendCaregiverInvite({
        relationshipId: 'relationship-id',
        patientId: user.userId,
        caregiverEmail: 'caregiver@example.com',
        relationshipType: CaregiverRelationshipType.PARENT,
        status: CaregiverRelationshipStatus.PENDING,
        invitedAt: 1782000000000,
        createdAt: 1782000000000,
        updatedAt: 1782000000000,
      }),
    ).resolves.toBe(false);
  });
});
