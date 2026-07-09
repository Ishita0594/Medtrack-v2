import { Injectable, Logger } from '@nestjs/common';
import {
  EmailMessage,
  NotificationProvider,
} from './notification-provider.interface';

@Injectable()
export class MockEmailProvider implements NotificationProvider {
  readonly name = 'MOCK' as const;
  private readonly logger = new Logger(MockEmailProvider.name);

  async sendEmail(message: EmailMessage): Promise<void> {
    this.logger.log(
      `Mock email notification to ${message.to} with subject "${message.subject}"`,
    );
  }
}
