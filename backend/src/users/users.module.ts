import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { USER_REPOSITORY } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY,
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
