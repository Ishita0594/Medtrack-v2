import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import {
  JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from './auth.constants';
import { AuthMapper } from './auth.mapper';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { InvalidCredentialsException } from './exceptions/invalid-credentials.exception';
import { REFRESH_TOKEN_REPOSITORY } from './repositories/refresh-token.repository';
import type { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserAlreadyExistsException } from '../users/exceptions/user-already-exists.exception';
import { USER_REPOSITORY } from '../users/repositories/user.repository';
import type { UserRepository } from '../users/repositories/user.repository';
import { UserRole } from '../users/enums/user-role.enum';
import { UserRecord } from '../users/users.types';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      this.configService.get<number>('security.bcryptSaltRounds') ?? 12,
    );
    const user = await this.userRepository.create({
      userId: uuidv7(),
      name: registerDto.name,
      email: registerDto.email,
      phone: registerDto.phone,
      role: registerDto.role,
      passwordHash,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(loginDto.email);

    if (!user?.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: UserRecord): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };
    const expiresIn = this.getAccessTokenExpiresIn();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn }),
      this.createRefreshToken(user.userId),
    ]);

    // TODO: In production, send the refresh token via an HttpOnly Secure cookie.
    // It is returned in the response body for development and Postman testing.
    return AuthMapper.toResponse(user, {
      accessToken,
      refreshToken,
      expiresIn,
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const tokenId = uuidv7();
    const refreshToken = `${tokenId}.${randomBytes(48).toString('base64url')}`;
    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      this.configService.get<number>('security.bcryptSaltRounds') ?? 12,
    );

    await this.refreshTokenRepository.create({
      tokenId,
      userId,
      refreshTokenHash,
      expiresAt: Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    });

    return refreshToken;
  }

  private getAccessTokenExpiresIn(): number {
    return (
      this.configService.get<number>('jwt.accessTokenExpiresIn') ??
      JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS
    );
  }
}
