import { NotFoundException } from '@nestjs/common';

export class MedicationNotFoundException extends NotFoundException {
  constructor() {
    super('Medication not found');
  }
}
