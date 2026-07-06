import { BadRequestException } from '@nestjs/common';

export class InvalidPrescriptionFileException extends BadRequestException {
  constructor(message = 'A valid prescription file is required') {
    super(message);
  }
}
