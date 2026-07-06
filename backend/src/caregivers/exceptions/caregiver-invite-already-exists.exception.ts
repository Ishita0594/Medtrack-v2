import { ConflictException } from '@nestjs/common';

export class CaregiverInviteAlreadyExistsException extends ConflictException {
  constructor() {
    super('A pending caregiver invitation already exists');
  }
}
