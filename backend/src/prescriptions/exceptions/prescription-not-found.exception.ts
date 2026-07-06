import { NotFoundException } from '@nestjs/common';

export class PrescriptionNotFoundException extends NotFoundException {
  constructor() {
    super('Prescription not found');
  }
}
