import { UnauthorizedException } from '@nestjs/common';
import { AUTH_MESSAGES } from '../auth.constants';

export class RefreshTokenExpiredException extends UnauthorizedException {
  constructor() {
    super(AUTH_MESSAGES.refreshTokenExpired);
  }
}
