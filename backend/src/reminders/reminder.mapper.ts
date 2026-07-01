import { ReminderResponseDto } from './dto/reminder-response.dto';
import { Reminder } from './reminder.interface';

export class ReminderMapper {
  static toResponse(reminder: Reminder): ReminderResponseDto {
    return {
      reminderId: reminder.reminderId,
      userId: reminder.userId,
      medicationId: reminder.medicationId,
      scheduledAt: reminder.scheduledAt,
      status: reminder.status,
      notificationType: reminder.notificationType,
      sentAt: reminder.sentAt,
      acknowledgedAt: reminder.acknowledgedAt,
      missedAt: reminder.missedAt,
      snoozedUntil: reminder.snoozedUntil,
      notes: reminder.notes,
      dateKey: reminder.dateKey,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
    };
  }

  static toResponseList(reminders: Reminder[]): ReminderResponseDto[] {
    return reminders.map((reminder) => this.toResponse(reminder));
  }
}
