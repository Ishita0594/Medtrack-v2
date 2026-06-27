import { UnauthorizedException } from '@nestjs/common';

export class AuthenticationRequiredException extends UnauthorizedException {
  constructor() {
    super('Authentication is required');
  }
}
