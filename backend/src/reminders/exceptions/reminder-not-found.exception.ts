import { NotFoundException } from '@nestjs/common';

export class ReminderNotFoundException extends NotFoundException {
  constructor() {
    super('Reminder not found');
  }
}
