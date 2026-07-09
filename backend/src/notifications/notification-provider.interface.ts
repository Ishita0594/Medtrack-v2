export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface NotificationProvider {
  readonly name: 'MOCK' | 'SMTP';
  sendEmail(message: EmailMessage): Promise<void>;
}
