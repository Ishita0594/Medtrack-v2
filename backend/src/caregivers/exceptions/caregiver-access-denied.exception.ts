import { ForbiddenException } from '@nestjs/common';

export class CaregiverAccessDeniedException extends ForbiddenException {
  constructor() {
    super('Caregiver relationship access denied');
  }
}
