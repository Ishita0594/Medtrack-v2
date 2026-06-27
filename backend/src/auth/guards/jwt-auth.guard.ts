import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AUTH_TOKEN_TYPE } from '../auth.constants';
import { AuthenticationRequiredException } from '../exceptions/authentication-required.exception';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';

interface JwtUserPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new AuthenticationRequiredException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUserPayload>(token);
      request.user = payload;

      return true;
    } catch {
      throw new AuthenticationRequiredException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === AUTH_TOKEN_TYPE ? token : undefined;
  }
}
