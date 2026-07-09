import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { MedicationsService } from '../medications/medications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ReminderQueryDto } from './dto/reminder-query.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { SnoozeReminderDto } from './dto/snooze-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderStatus } from './enums/reminder-status.enum';
import { InvalidReminderStatusTransitionException } from './exceptions/invalid-reminder-status-transition.exception';
import { InvalidSnoozeTimeException } from './exceptions/invalid-snooze-time.exception';
import { ReminderNotFoundException } from './exceptions/reminder-not-found.exception';
import { Reminder } from './reminder.interface';
import { ReminderMapper } from './reminder.mapper';
import { REMINDER_REPOSITORY } from './repositories/reminder.repository';
import type {
  ReminderRepository,
  UpdateReminderRecordInput,
} from './repositories/reminder.repository';

const ALLOWED_TRANSITIONS: Record<ReminderStatus, ReminderStatus[]> = {
  [ReminderStatus.PENDING]: [
    ReminderStatus.SENT,
    ReminderStatus.ACKNOWLEDGED,
    ReminderStatus.MISSED,
    ReminderStatus.CANCELLED,
  ],
  [ReminderStatus.SENT]: [
    ReminderStatus.PENDING,
    ReminderStatus.ACKNOWLEDGED,
    ReminderStatus.MISSED,
    ReminderStatus.CANCELLED,
  ],
  [ReminderStatus.ACKNOWLEDGED]: [],
  [ReminderStatus.MISSED]: [],
  [ReminderStatus.CANCELLED]: [],
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: ReminderRepository,
    private readonly medicationsService: MedicationsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    input: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    await this.medicationsService.findOne(userId, input.medicationId);
    const reminder = await this.reminderRepository.create({
      reminderId: uuidv7(),
      userId,
      medicationId: input.medicationId,
      scheduledAt: input.scheduledAt,
      status: ReminderStatus.PENDING,
      notificationType: input.notificationType,
      notes: input.notes,
      dateKey: this.toDateKey(input.scheduledAt),
    });

    return ReminderMapper.toResponse(reminder);
  }

  async findAll(
    userId: string,
    query: ReminderQueryDto,
  ): Promise<ReminderResponseDto[]> {
    this.validateDateRange(query.from, query.to);
    const reminders = await this.reminderRepository.findAllByUserId(userId);
    const filtered = reminders.filter((reminder) =>
      this.matchesQuery(reminder, query),
    );

    return ReminderMapper.toResponseList(filtered);
  }

  async findOne(
    userId: string,
    reminderId: string,
  ): Promise<ReminderResponseDto> {
    const reminder = await this.getOwnedReminder(userId, reminderId);

    return ReminderMapper.toResponse(reminder);
  }

  async update(
    userId: string,
    reminderId: string,
    input: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    const existing = await this.getOwnedReminder(userId, reminderId);
    const update: UpdateReminderRecordInput = {
      scheduledAt: input.scheduledAt,
      notificationType: input.notificationType,
      notes: input.notes,
    };

    if (input.scheduledAt !== undefined) {
      update.dateKey = this.toDateKey(input.scheduledAt);
    }

    if (input.status !== undefined && input.status !== existing.status) {
      this.assertTransition(existing.status, input.status);
      Object.assign(update, this.transitionUpdate(input.status));
    }

    const updated = await this.reminderRepository.update(
      userId,
      reminderId,
      update,
    );

    if (!updated) {
      throw new ReminderNotFoundException();
    }

    return ReminderMapper.toResponse(updated);
  }

  async acknowledge(
    userId: string,
    reminderId: string,
  ): Promise<ReminderResponseDto> {
    const updated = await this.transition(
      userId,
      reminderId,
      ReminderStatus.ACKNOWLEDGED,
    );

    // TODO: Optionally create a TAKEN adherence record in a future workflow.
    return ReminderMapper.toResponse(updated);
  }

  async snooze(
    userId: string,
    reminderId: string,
    input: SnoozeReminderDto,
  ): Promise<ReminderResponseDto> {
    const now = Date.now();

    if (input.snoozedUntil <= now) {
      throw new InvalidSnoozeTimeException();
    }

    const existing = await this.getOwnedReminder(userId, reminderId);

    if (
      existing.status !== ReminderStatus.PENDING &&
      existing.status !== ReminderStatus.SENT
    ) {
      throw new InvalidReminderStatusTransitionException(
        existing.status,
        ReminderStatus.PENDING,
      );
    }

    const updated = await this.reminderRepository.update(userId, reminderId, {
      status: ReminderStatus.PENDING,
      snoozedUntil: input.snoozedUntil,
      clearSentAt: existing.status === ReminderStatus.SENT,
    });

    if (!updated) {
      throw new ReminderNotFoundException();
    }

    return ReminderMapper.toResponse(updated);
  }

  async markMissed(
    userId: string,
    reminderId: string,
  ): Promise<ReminderResponseDto> {
    const updated = await this.transition(
      userId,
      reminderId,
      ReminderStatus.MISSED,
    );

    // TODO: Optionally create a MISSED adherence record in a future workflow.
    return ReminderMapper.toResponse(updated);
  }

  async remove(
    userId: string,
    reminderId: string,
  ): Promise<{ message: string }> {
    const deleted = await this.reminderRepository.delete(userId, reminderId);

    if (!deleted) {
      throw new ReminderNotFoundException();
    }

    return { message: 'Reminder deleted successfully' };
  }

  async processDueReminders(now = Date.now()): Promise<number> {
    const dueReminders = await this.reminderRepository.findDuePending(now);
    let sentCount = 0;

    for (const reminder of dueReminders) {
      let claimedReminder: Reminder | null = null;

      try {
        claimedReminder = await this.reminderRepository.claimAsSent(
          reminder.userId,
          reminder.reminderId,
          now,
        );

        if (!claimedReminder) {
          continue;
        }

        const sent = await this.notificationsService.sendReminder(
          claimedReminder,
        );

        if (!sent) {
          await this.reminderRepository.update(
            reminder.userId,
            reminder.reminderId,
            {
              status: ReminderStatus.PENDING,
              clearSentAt: true,
            },
          );
          continue;
        }

        sentCount += 1;
      } catch (error) {
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        this.logger.error(
          `Reminder dispatch failed for ${reminder.reminderId}: ${errorName}`,
        );
        if (claimedReminder) {
          await this.reminderRepository.update(
            reminder.userId,
            reminder.reminderId,
            {
              status: ReminderStatus.PENDING,
              clearSentAt: true,
            },
          );
        }
      }
    }

    return sentCount;
  }

  private async transition(
    userId: string,
    reminderId: string,
    targetStatus: ReminderStatus,
  ): Promise<Reminder> {
    const existing = await this.getOwnedReminder(userId, reminderId);
    this.assertTransition(existing.status, targetStatus);
    const updated = await this.reminderRepository.update(
      userId,
      reminderId,
      this.transitionUpdate(targetStatus),
    );

    if (!updated) {
      throw new ReminderNotFoundException();
    }

    return updated;
  }

  private transitionUpdate(status: ReminderStatus): UpdateReminderRecordInput {
    const now = Date.now();
    const update: UpdateReminderRecordInput = { status };

    if (status === ReminderStatus.SENT) {
      update.sentAt = now;
    } else if (status === ReminderStatus.ACKNOWLEDGED) {
      update.acknowledgedAt = now;
    } else if (status === ReminderStatus.MISSED) {
      update.missedAt = now;
    } else if (status === ReminderStatus.PENDING) {
      update.clearSentAt = true;
    }

    return update;
  }

  private assertTransition(
    current: ReminderStatus,
    target: ReminderStatus,
  ): void {
    if (!ALLOWED_TRANSITIONS[current].includes(target)) {
      throw new InvalidReminderStatusTransitionException(current, target);
    }
  }

  private async getOwnedReminder(
    userId: string,
    reminderId: string,
  ): Promise<Reminder> {
    const reminder = await this.reminderRepository.findById(userId, reminderId);

    if (!reminder) {
      throw new ReminderNotFoundException();
    }

    return reminder;
  }

  private matchesQuery(reminder: Reminder, query: ReminderQueryDto): boolean {
    return !(
      (query.medicationId && reminder.medicationId !== query.medicationId) ||
      (query.status && reminder.status !== query.status) ||
      (query.from !== undefined && reminder.scheduledAt < query.from) ||
      (query.to !== undefined && reminder.scheduledAt > query.to) ||
      (query.dateKey && reminder.dateKey !== query.dateKey)
    );
  }

  private validateDateRange(from?: number, to?: number): void {
    if (from !== undefined && to !== undefined && from > to) {
      throw new BadRequestException('from must be less than or equal to to');
    }
  }

  private toDateKey(scheduledAt: number): string {
    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'scheduledAt must be valid epoch milliseconds',
      );
    }

    return date.toISOString().slice(0, 10);
  }
}
