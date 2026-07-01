import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamoDbModule } from '../database/dynamodb/dynamodb.module';
import { MedicationsModule } from '../medications/medications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { REMINDER_REPOSITORY } from './repositories/reminder.repository';
import { DynamoDbReminderRepository } from './repositories/dynamodb-reminder.repository';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    DynamoDbModule,
    MedicationsModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [RemindersController],
  providers: [
    RemindersService,
    ReminderSchedulerService,
    JwtAuthGuard,
    {
      provide: REMINDER_REPOSITORY,
      useClass: DynamoDbReminderRepository,
    },
  ],
  exports: [RemindersService],
})
export class RemindersModule {}
