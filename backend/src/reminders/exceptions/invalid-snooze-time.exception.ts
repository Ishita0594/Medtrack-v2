import { BadRequestException } from '@nestjs/common';

export class InvalidSnoozeTimeException extends BadRequestException {
  constructor() {
    super('snoozedUntil must be a future timestamp');
  }
}
