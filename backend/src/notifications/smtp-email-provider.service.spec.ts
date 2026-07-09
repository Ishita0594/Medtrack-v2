import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import nodemailer from 'nodemailer';
import { SmtpEmailProvider } from './smtp-email-provider.service';

jest.mock('nodemailer', () => {
  const transporter = { sendMail: jest.fn() };
  const createTransport = jest.fn(() => transporter);

  return {
    __esModule: true,
    default: {
      createTransport,
    },
    createTransport,
  };
});

describe('SmtpEmailProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is injectable and sends through Nodemailer', async () => {
    const module = await Test.createTestingModule({
      providers: [
        SmtpEmailProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string | number | boolean> = {
                'email.smtp.from': 'MedTrack <test@example.com>',
                'email.smtp.host': 'smtp.example.com',
                'email.smtp.port': 587,
                'email.smtp.secure': false,
                'email.smtp.user': 'test@example.com',
                'email.smtp.pass': 'app-password',
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();
    const provider = module.get(SmtpEmailProvider);

    await provider.sendEmail({
      to: 'caregiver@example.com',
      subject: 'MedTrack caregiver invitation',
      text: 'Invite text',
      html: '<p>Invite text</p>',
    });

    const createTransport = jest.mocked(nodemailer.createTransport);
    const transporter = createTransport.mock.results[0].value as {
      sendMail: jest.Mock;
    };

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
      }),
    );
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'caregiver@example.com',
        subject: 'MedTrack caregiver invitation',
      }),
    );
  });
});
