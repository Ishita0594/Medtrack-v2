import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { DynamoDbModule } from './database/dynamodb/dynamodb.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MedicationsModule } from './medications/medications.module';
import { AdherenceModule } from './adherence/adherence.module';
import { CaregiversModule } from './caregivers/caregivers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validate: validateEnvironment,
    }),
    ScheduleModule.forRoot(),
    DynamoDbModule,
    UsersModule,
    AuthModule,
    MedicationsModule,
    AdherenceModule,
    CaregiversModule,
    NotificationsModule,
    RemindersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
