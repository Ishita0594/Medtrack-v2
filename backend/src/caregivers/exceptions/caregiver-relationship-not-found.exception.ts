import { NotFoundException } from '@nestjs/common';

export class CaregiverRelationshipNotFoundException extends NotFoundException {
  constructor() {
    super('Caregiver relationship not found');
  }
}
