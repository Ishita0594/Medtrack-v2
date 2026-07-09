import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import {
  EmailMessage,
  NotificationProvider,
} from './notification-provider.interface';

@Injectable()
export class SmtpEmailProvider implements NotificationProvider {
  readonly name = 'SMTP' as const;
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from =
      this.configService.get<string>('email.smtp.from') ??
      'MedTrack <no-reply@example.com>';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.smtp.host') ?? 'localhost',
      port: this.configService.get<number>('email.smtp.port') ?? 587,
      secure: this.configService.get<boolean>('email.smtp.secure') ?? false,
      auth: {
        user: this.configService.get<string>('email.smtp.user') ?? '',
        pass: this.configService.get<string>('email.smtp.pass') ?? '',
      },
    });
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    this.logger.log(`SMTP email sent to ${message.to}`);
  }
}
