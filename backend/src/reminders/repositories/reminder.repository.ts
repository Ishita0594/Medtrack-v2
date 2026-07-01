import { NotificationType } from '../enums/notification-type.enum';
import { ReminderStatus } from '../enums/reminder-status.enum';
import { Reminder } from '../reminder.interface';

export const REMINDER_REPOSITORY = Symbol('REMINDER_REPOSITORY');

export interface CreateReminderRecordInput {
  reminderId: string;
  userId: string;
  medicationId: string;
  scheduledAt: number;
  status: ReminderStatus;
  notificationType: NotificationType;
  notes?: string;
  dateKey: string;
}

export interface UpdateReminderRecordInput {
  scheduledAt?: number;
  status?: ReminderStatus;
  notificationType?: NotificationType;
  sentAt?: number;
  acknowledgedAt?: number;
  missedAt?: number;
  snoozedUntil?: number;
  notes?: string;
  dateKey?: string;
  clearSentAt?: boolean;
}

export interface ReminderRepository {
  create(input: CreateReminderRecordInput): Promise<Reminder>;
  findAllByUserId(userId: string): Promise<Reminder[]>;
  findById(userId: string, reminderId: string): Promise<Reminder | null>;
  update(
    userId: string,
    reminderId: string,
    input: UpdateReminderRecordInput,
  ): Promise<Reminder | null>;
  delete(userId: string, reminderId: string): Promise<boolean>;
  findDuePending(now: number): Promise<Reminder[]>;
  claimAsSent(
    userId: string,
    reminderId: string,
    now: number,
  ): Promise<Reminder | null>;
}
