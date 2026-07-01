import { BadRequestException } from '@nestjs/common';

export class InvalidMedicationScheduleException extends BadRequestException {
  constructor() {
    super('endDate must be greater than startDate');
  }
}
