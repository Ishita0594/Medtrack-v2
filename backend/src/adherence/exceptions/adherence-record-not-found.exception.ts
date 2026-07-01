import { NotFoundException } from '@nestjs/common';

export class AdherenceRecordNotFoundException extends NotFoundException {
  constructor() {
    super('Adherence record not found');
  }
}
