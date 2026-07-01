import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';
import { ReminderStatus } from '../enums/reminder-status.enum';

export class ReminderResponseDto {
  @ApiProperty({ example: '01972e60-7f2c-75be-89a4-cfd939f272ce' })
  reminderId: string;

  @ApiProperty({ example: '01972e10-49bb-73d4-a8d3-01cc389342f2' })
  userId: string;

  @ApiProperty({ example: '01972e26-4d7a-7f47-a38e-04dd8a0fb731' })
  medicationId: string;

  @ApiProperty({ example: 1782400000000 })
  scheduledAt: number;

  @ApiProperty({ enum: ReminderStatus, example: ReminderStatus.PENDING })
  status: ReminderStatus;

  @ApiProperty({ enum: NotificationType, example: NotificationType.IN_APP })
  notificationType: NotificationType;

  @ApiPropertyOptional({ example: 1782400000000 })
  sentAt?: number;

  @ApiPropertyOptional({ example: 1782400300000 })
  acknowledgedAt?: number;

  @ApiPropertyOptional({ example: 1782400600000 })
  missedAt?: number;

  @ApiPropertyOptional({ example: 1782403600000 })
  snoozedUntil?: number;

  @ApiPropertyOptional({ example: 'Morning reminder' })
  notes?: string;

  @ApiProperty({ example: '2026-06-25' })
  dateKey: string;

  @ApiProperty({ example: 1782000000000 })
  createdAt: number;

  @ApiProperty({ example: 1782000000000 })
  updatedAt: number;
}
