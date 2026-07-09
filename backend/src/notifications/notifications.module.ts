import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MedicationsModule } from '../medications/medications.module';
import { UsersModule } from '../users/users.module';
import { EmailTemplateService } from './email-template.service';
import { MockEmailProvider } from './mock-email-provider.service';
import { NOTIFICATION_PROVIDER } from './notification-provider.interface';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SmtpEmailProvider } from './smtp-email-provider.service';

@Module({
  imports: [UsersModule, MedicationsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailTemplateService,
    MockEmailProvider,
    SmtpEmailProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      inject: [ConfigService, MockEmailProvider, SmtpEmailProvider],
      useFactory: (
        configService: ConfigService,
        mockEmailProvider: MockEmailProvider,
        smtpEmailProvider: SmtpEmailProvider,
      ) => {
        const provider = configService.get<string>('email.provider') ?? 'MOCK';
        return provider === 'SMTP' ? smtpEmailProvider : mockEmailProvider;
      },
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
