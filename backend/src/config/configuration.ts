function parseJwtExpiresInSeconds(value: string | undefined): number {
  const rawValue = value ?? process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '900';
  const numericValue = Number(rawValue);

  if (Number.isInteger(numericValue)) {
    return numericValue;
  }

  const match = rawValue.match(/^(\d+)([smhd])$/);

  if (!match) {
    return 900;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * multipliers[unit];
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

export default () => ({
  app: {
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT,
    usersTableName: process.env.DYNAMODB_USERS_TABLE_NAME ?? 'Users',
    medicationsTableName:
      process.env.DYNAMODB_MEDICATIONS_TABLE_NAME ?? 'Medications',
    refreshTokensTableName:
      process.env.DYNAMODB_REFRESH_TOKENS_TABLE_NAME ?? 'RefreshTokens',
    adherenceTableName:
      process.env.DYNAMODB_ADHERENCE_TABLE_NAME ?? 'AdherenceRecords',
    reminderEventsTableName:
      process.env.DYNAMODB_REMINDER_EVENTS_TABLE_NAME ?? 'ReminderEvents',
    caregiverRelationshipsTableName:
      process.env.DYNAMODB_CAREGIVER_RELATIONSHIPS_TABLE_NAME ??
      'CaregiverRelationships',
    prescriptionUploadsTableName:
      process.env.DYNAMODB_PRESCRIPTION_UPLOADS_TABLE_NAME ??
      'PrescriptionUploads',
  },
  prescriptions: {
    storageProvider: process.env.PRESCRIPTION_STORAGE_PROVIDER ?? 'LOCAL',
    ocrProvider: process.env.OCR_PROVIDER ?? 'MOCK',
    aiParserProvider: process.env.AI_PARSER_PROVIDER ?? 'MOCK',
    uploadDir: process.env.PRESCRIPTION_UPLOAD_DIR ?? 'uploads/prescriptions',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  email: {
    provider: process.env.EMAIL_PROVIDER ?? 'MOCK',
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: parseBoolean(process.env.SMTP_SECURE, false),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM ?? 'MedTrack <no-reply@example.com>',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    accessTokenExpiresIn: parseJwtExpiresInSeconds(process.env.JWT_EXPIRES_IN),
  },
  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  },
});
