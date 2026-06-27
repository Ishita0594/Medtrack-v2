import { NotFoundException } from '@nestjs/common';
import { USER_MESSAGES } from '../users.constants';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super(USER_MESSAGES.notFound);
  }
}
