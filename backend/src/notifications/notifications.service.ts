import { Inject, Injectable, Logger } from '@nestjs/common';
import type { CaregiverRelationship } from '../caregivers/caregiver.interface';
import { MedicationsService } from '../medications/medications.service';
import { NotificationType } from '../reminders/enums/notification-type.enum';
import type { Reminder } from '../reminders/reminder.interface';
import { UsersService } from '../users/users.service';
import { EmailTemplateService } from './email-template.service';
import { NOTIFICATION_PROVIDER } from './notification-provider.interface';
import type { NotificationProvider } from './notification-provider.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(NOTIFICATION_PROVIDER)
    private readonly notificationProvider: NotificationProvider,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly usersService: UsersService,
    private readonly medicationsService: MedicationsService,
  ) {}

  getStatus() {
    return {
      module: 'notifications',
      status: 'ready',
      provider: this.notificationProvider.name,
    };
  }

  async sendReminder(reminder: Reminder): Promise<boolean> {
    if (reminder.notificationType !== NotificationType.EMAIL) {
      this.logger.log(
        `Handled ${reminder.notificationType} notification for reminder ${reminder.reminderId}`,
      );
      return true;
    }

    try {
      const [user, medication] = await Promise.all([
        this.findReminderUser(reminder),
        this.findReminderMedication(reminder),
      ]);

      if (!user?.email) {
        this.logger.warn(
          `Reminder email skipped for ${reminder.reminderId}: user email unavailable`,
        );
        return false;
      }

      const email = this.emailTemplateService.renderReminder(
        reminder,
        medication,
      );
      await this.notificationProvider.sendEmail({
        to: user.email,
        ...email,
      });
      this.logger.log(`Reminder email queued for reminder ${reminder.reminderId}`);
      return true;
    } catch (error) {
      this.logNotificationFailure('reminder', reminder.reminderId, error);
      return false;
    }
  }

  async sendCaregiverInvite(
    relationship: CaregiverRelationship,
  ): Promise<boolean> {
    try {
      const patient = await this.findPatient(relationship.patientId);
      const email = this.emailTemplateService.renderCaregiverInvite(
        relationship,
        patient,
      );

      await this.notificationProvider.sendEmail({
        to: relationship.caregiverEmail,
        ...email,
      });
      this.logger.log(
        `Caregiver invitation email queued for relationship ${relationship.relationshipId}`,
      );
      return true;
    } catch (error) {
      this.logNotificationFailure(
        'caregiver invite',
        relationship.relationshipId,
        error,
      );
      return false;
    }
  }

  private async findPatient(patientId: string) {
    try {
      return await this.usersService.findOne(patientId);
    } catch {
      return null;
    }
  }

  private async findReminderUser(reminder: Reminder) {
    try {
      return await this.usersService.findOne(reminder.userId);
    } catch {
      return null;
    }
  }

  private async findReminderMedication(reminder: Reminder) {
    try {
      return await this.medicationsService.findOne(
        reminder.userId,
        reminder.medicationId,
      );
    } catch {
      return null;
    }
  }

  private logNotificationFailure(
    workflow: string,
    entityId: string,
    error: unknown,
  ): void {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    this.logger.warn(
      `${workflow} notification failed for ${entityId}: ${errorName}`,
    );
  }
}
