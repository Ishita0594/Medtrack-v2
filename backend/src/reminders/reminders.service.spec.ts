jest.mock('uuid', () => ({
  v7: jest.fn(() => '01972e60-7f2c-75be-89a4-cfd939f272ce'),
}));

import { MedicationsService } from '../medications/medications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from './enums/notification-type.enum';
import { ReminderStatus } from './enums/reminder-status.enum';
import { InvalidReminderStatusTransitionException } from './exceptions/invalid-reminder-status-transition.exception';
import { InvalidSnoozeTimeException } from './exceptions/invalid-snooze-time.exception';
import { Reminder } from './reminder.interface';
import type { ReminderRepository } from './repositories/reminder.repository';
import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  const userId = '01972e10-49bb-73d4-a8d3-01cc389342f2';
  const medicationId = '01972e26-4d7a-7f47-a38e-04dd8a0fb731';
  const reminderId = '01972e60-7f2c-75be-89a4-cfd939f272ce';
  const reminder: Reminder = {
    reminderId,
    userId,
    medicationId,
    scheduledAt: 1782400000000,
    status: ReminderStatus.PENDING,
    notificationType: NotificationType.IN_APP,
    dateKey: '2026-06-25',
    createdAt: 1782000000000,
    updatedAt: 1782000000000,
  };
  let repository: jest.Mocked<ReminderRepository>;
  let medicationsService: jest.Mocked<Pick<MedicationsService, 'findOne'>>;
  let notificationsService: jest.Mocked<
    Pick<NotificationsService, 'sendReminder'>
  >;
  let service: RemindersService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findDuePending: jest.fn(),
      claimAsSent: jest.fn(),
    };
    medicationsService = { findOne: jest.fn() };
    notificationsService = { sendReminder: jest.fn() };
    service = new RemindersService(
      repository,
      medicationsService as unknown as MedicationsService,
      notificationsService as unknown as NotificationsService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies medication ownership and creates a pending reminder', async () => {
    medicationsService.findOne.mockResolvedValue({} as never);
    repository.create.mockResolvedValue(reminder);

    await service.create(userId, {
      medicationId,
      scheduledAt: reminder.scheduledAt,
      notificationType: NotificationType.IN_APP,
    });

    expect(medicationsService.findOne).toHaveBeenCalledWith(
      userId,
      medicationId,
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderId,
        userId,
        status: ReminderStatus.PENDING,
        dateKey: '2026-06-25',
      }),
    );
  });

  it('rejects transitions from a terminal state', async () => {
    repository.findById.mockResolvedValue({
      ...reminder,
      status: ReminderStatus.ACKNOWLEDGED,
    });

    await expect(service.markMissed(userId, reminderId)).rejects.toBeInstanceOf(
      InvalidReminderStatusTransitionException,
    );
  });

  it('rejects a snooze timestamp that is not in the future', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1782400000000);

    await expect(
      service.snooze(userId, reminderId, {
        snoozedUntil: 1782400000000,
      }),
    ).rejects.toBeInstanceOf(InvalidSnoozeTimeException);
  });

  it('acknowledges a pending reminder with a timestamp', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1782400300000);
    repository.findById.mockResolvedValue(reminder);
    repository.update.mockResolvedValue({
      ...reminder,
      status: ReminderStatus.ACKNOWLEDGED,
      acknowledgedAt: 1782400300000,
    });

    await service.acknowledge(userId, reminderId);

    expect(repository.update).toHaveBeenCalledWith(
      userId,
      reminderId,
      expect.objectContaining({
        status: ReminderStatus.ACKNOWLEDGED,
        acknowledgedAt: 1782400300000,
      }),
    );
  });

  it('claims due reminders before sending mock notifications', async () => {
    const sentReminder = {
      ...reminder,
      status: ReminderStatus.SENT,
      sentAt: 1782400300000,
    };
    repository.findDuePending.mockResolvedValue([reminder]);
    repository.claimAsSent.mockResolvedValue(sentReminder);
    notificationsService.sendReminder.mockResolvedValue(true);

    await expect(service.processDueReminders(1782400300000)).resolves.toBe(1);
    expect(repository.claimAsSent).toHaveBeenCalledWith(
      userId,
      reminderId,
      1782400300000,
    );
    expect(notificationsService.sendReminder).toHaveBeenCalledWith(
      sentReminder,
    );
  });

  it('does not crash when reminder notification delivery fails', async () => {
    const sentReminder = {
      ...reminder,
      status: ReminderStatus.SENT,
      sentAt: 1782400300000,
    };
    repository.findDuePending.mockResolvedValue([reminder]);
    repository.claimAsSent.mockResolvedValue(sentReminder);
    notificationsService.sendReminder.mockRejectedValue(new Error('smtp down'));
    repository.update.mockResolvedValue({
      ...reminder,
      status: ReminderStatus.PENDING,
    });

    await expect(service.processDueReminders(1782400300000)).resolves.toBe(0);
  });
});
