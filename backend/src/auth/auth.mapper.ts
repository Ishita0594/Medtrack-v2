import { AuthResponseDto } from './dto/auth-response.dto';
import { AUTH_TOKEN_TYPE } from './auth.constants';
import { UserMapper } from '../users/users.mapper';
import { UserRecord } from '../users/users.types';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthMapper {
  static toResponse(user: UserRecord, tokens: AuthTokenPair): AuthResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: AUTH_TOKEN_TYPE,
      expiresIn: tokens.expiresIn,
      user: UserMapper.toResponse(user),
    };
  }
}
