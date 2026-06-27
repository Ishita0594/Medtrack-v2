import { ConflictException } from '@nestjs/common';
import { USER_MESSAGES } from '../users.constants';

export class UserAlreadyExistsException extends ConflictException {
  constructor() {
    super(USER_MESSAGES.alreadyExists);
  }
}
