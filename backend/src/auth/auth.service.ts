import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/dto/create-user.dto';

interface AuthUserRecord {
  PK: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface AuthenticatedUser {
  PK: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

 export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  private readonly usersByEmail = new Map<string, AuthUserRecord>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const email = registerDto.email.toLowerCase();

    if (this.usersByEmail.has(email)) {
      throw new ConflictException('Email is already registered');
    }

    const now = Date.now();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(
      registerDto.password,
      this.configService.get<number>('security.bcryptSaltRounds') ?? 12,
    );

    const user: AuthUserRecord = {
      PK: this.buildPrimaryKey(userId),
      userId,
      name: registerDto.name,
      email,
      phone: registerDto.phone,
      role: registerDto.role,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    this.usersByEmail.set(email, user);

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const email = loginDto.email.toLowerCase();
    const user = this.usersByEmail.get(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: AuthUserRecord): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };
    const expiresIn =
      this.configService.get<string>('jwt.accessTokenExpiresIn') ?? '15m';
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn:'15m',
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: this.toAuthenticatedUser(user),
    };
  }

  private toAuthenticatedUser(user: AuthUserRecord): AuthenticatedUser {
    return {
      PK: user.PK,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private buildPrimaryKey(userId: string): string {
    return `USER#${userId}`;
  }
}
