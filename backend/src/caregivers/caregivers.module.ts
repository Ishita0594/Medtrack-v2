import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdherenceModule } from '../adherence/adherence.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamoDbModule } from '../database/dynamodb/dynamodb.module';
import { MedicationsModule } from '../medications/medications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CaregiversController } from './caregivers.controller';
import { CaregiversService } from './caregivers.service';
import { CAREGIVER_REPOSITORY } from './repositories/caregiver.repository';
import { DynamoDbCaregiverRepository } from './repositories/dynamodb-caregiver.repository';

@Module({
  imports: [
    DynamoDbModule,
    MedicationsModule,
    AdherenceModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [CaregiversController],
  providers: [
    CaregiversService,
    JwtAuthGuard,
    {
      provide: CAREGIVER_REPOSITORY,
      useClass: DynamoDbCaregiverRepository,
    },
  ],
  exports: [CaregiversService],
})
export class CaregiversModule {}
