import { Injectable, Logger } from '@nestjs/common';
import type { CaregiverRelationship } from '../caregivers/caregiver.interface';
import type { Reminder } from '../reminders/reminder.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  getStatus() {
    return {
      module: 'notifications',
      status: 'ready',
    };
  }

  async sendReminder(reminder: Reminder): Promise<void> {
    this.logger.log(
      `Mock ${reminder.notificationType} notification for reminder ${reminder.reminderId}`,
    );
  }

  async sendCaregiverInvite(
    relationship: CaregiverRelationship,
  ): Promise<void> {
    this.logger.log(
      `Mock caregiver invitation for relationship ${relationship.relationshipId}`,
    );
  }
}
