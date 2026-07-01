import { BadRequestException } from '@nestjs/common';
import { ReminderStatus } from '../enums/reminder-status.enum';

export class InvalidReminderStatusTransitionException extends BadRequestException {
  constructor(from: ReminderStatus, to: ReminderStatus) {
    super(`Cannot transition reminder status from ${from} to ${to}`);
  }
}
