import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { InMemoryRefreshTokenRepository } from './repositories/in-memory-refresh-token.repository';
import { REFRESH_TOKEN_REPOSITORY } from './repositories/refresh-token.repository';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn:
            configService.get<number>('jwt.accessTokenExpiresIn') ?? 900,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: InMemoryRefreshTokenRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
