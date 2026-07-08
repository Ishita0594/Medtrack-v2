export type ReminderStatus =
  | 'PENDING'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'MISSED'
  | 'CANCELLED';

export type NotificationType = 'IN_APP' | 'EMAIL';

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

export interface ReminderPayload {
  medicationId: string;
  scheduledAt: number;
  notificationType: NotificationType;
  notes?: string;
}

export interface UpdateReminderPayload {
  scheduledAt?: number;
  notificationType?: NotificationType;
  status?: ReminderStatus;
  notes?: string;
}
