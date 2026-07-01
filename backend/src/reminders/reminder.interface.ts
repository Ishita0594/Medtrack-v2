import { NotificationType } from './enums/notification-type.enum';
import { ReminderStatus } from './enums/reminder-status.enum';

export interface Reminder {
  reminderId: string;
  userId: string;
  medicationId: string;
  scheduledAt: number;
  status: ReminderStatus;
  notificationType: NotificationType;
  sentAt?: number;
  acknowledgedAt?: number;
  missedAt?: number;
  snoozedUntil?: number;
  notes?: string;
  dateKey: string;
  createdAt: number;
  updatedAt: number;
}
