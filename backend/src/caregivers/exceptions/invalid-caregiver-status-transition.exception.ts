import { BadRequestException } from '@nestjs/common';
import { CaregiverRelationshipStatus } from '../enums/caregiver-relationship-status.enum';

export class InvalidCaregiverStatusTransitionException extends BadRequestException {
  constructor(
    from: CaregiverRelationshipStatus,
    to: CaregiverRelationshipStatus,
  ) {
    super(`Cannot transition caregiver relationship from ${from} to ${to}`);
  }
}
