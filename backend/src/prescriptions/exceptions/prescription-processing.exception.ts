import { UnprocessableEntityException } from '@nestjs/common';

export class PrescriptionProcessingException extends UnprocessableEntityException {
  constructor() {
    super('Prescription processing failed');
  }
}
