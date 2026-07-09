const allowedNodeEnvs = ['development', 'test', 'staging', 'production'];

function parseDurationSeconds(value: string): number {
  const numericValue = Number(value);

  if (Number.isInteger(numericValue)) {
    return numericValue;
  }

  const match = value.match(/^(\d+)([smhd])$/);

  if (!match) {
    return Number.NaN;
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

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const port = Number(config.PORT ?? 3000);
  const awsRegion = String(config.AWS_REGION ?? 'ap-south-1');
  const awsAccessKeyId = config.AWS_ACCESS_KEY_ID
    ? String(config.AWS_ACCESS_KEY_ID)
    : undefined;
  const awsSecretAccessKey = config.AWS_SECRET_ACCESS_KEY
    ? String(config.AWS_SECRET_ACCESS_KEY)
    : undefined;
  const usersTableName = String(config.DYNAMODB_USERS_TABLE_NAME ?? 'Users');
  const medicationsTableName = String(
    config.DYNAMODB_MEDICATIONS_TABLE_NAME ?? 'Medications',
  );
  const refreshTokensTableName = String(
    config.DYNAMODB_REFRESH_TOKENS_TABLE_NAME ?? 'RefreshTokens',
  );
  const adherenceTableName = String(
    config.DYNAMODB_ADHERENCE_TABLE_NAME ?? 'AdherenceRecords',
  );
  const reminderEventsTableName = String(
    config.DYNAMODB_REMINDER_EVENTS_TABLE_NAME ?? 'ReminderEvents',
  );
  const caregiverRelationshipsTableName = String(
    config.DYNAMODB_CAREGIVER_RELATIONSHIPS_TABLE_NAME ??
      'CaregiverRelationships',
  );
  const prescriptionUploadsTableName = String(
    config.DYNAMODB_PRESCRIPTION_UPLOADS_TABLE_NAME ?? 'PrescriptionUploads',
  );
  const prescriptionStorageProvider = String(
    config.PRESCRIPTION_STORAGE_PROVIDER ?? 'LOCAL',
  );
  const ocrProvider = String(config.OCR_PROVIDER ?? 'MOCK');
  const aiParserProvider = String(config.AI_PARSER_PROVIDER ?? 'MOCK');
  const prescriptionUploadDir = String(
    config.PRESCRIPTION_UPLOAD_DIR ?? 'uploads/prescriptions',
  );
  const jwtSecret = String(config.JWT_SECRET ?? 'change-me-in-production');
  const jwtExpiresIn = String(
    config.JWT_EXPIRES_IN ?? config.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '900',
  );
  const jwtAccessTokenExpiresIn = parseDurationSeconds(jwtExpiresIn);
  const bcryptSaltRounds = Number(config.BCRYPT_SALT_ROUNDS ?? 12);

  if (!allowedNodeEnvs.includes(nodeEnv)) {
    throw new Error(`NODE_ENV must be one of: ${allowedNodeEnvs.join(', ')}`);
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  if (!awsRegion.trim()) {
    throw new Error('AWS_REGION is required');
  }

  if (Boolean(awsAccessKeyId) !== Boolean(awsSecretAccessKey)) {
    throw new Error(
      'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together',
    );
  }

  if (!usersTableName.trim()) {
    throw new Error('DYNAMODB_USERS_TABLE_NAME is required');
  }

  if (!medicationsTableName.trim()) {
    throw new Error('DYNAMODB_MEDICATIONS_TABLE_NAME is required');
  }

  if (!refreshTokensTableName.trim()) {
    throw new Error('DYNAMODB_REFRESH_TOKENS_TABLE_NAME is required');
  }

  if (!adherenceTableName.trim()) {
    throw new Error('DYNAMODB_ADHERENCE_TABLE_NAME is required');
  }

  if (!reminderEventsTableName.trim()) {
    throw new Error('DYNAMODB_REMINDER_EVENTS_TABLE_NAME is required');
  }

  if (!caregiverRelationshipsTableName.trim()) {
    throw new Error('DYNAMODB_CAREGIVER_RELATIONSHIPS_TABLE_NAME is required');
  }

  if (!prescriptionUploadsTableName.trim()) {
    throw new Error('DYNAMODB_PRESCRIPTION_UPLOADS_TABLE_NAME is required');
  }

  if (prescriptionStorageProvider !== 'LOCAL') {
    throw new Error('PRESCRIPTION_STORAGE_PROVIDER must currently be LOCAL');
  }

  if (ocrProvider !== 'MOCK') {
    throw new Error('OCR_PROVIDER must currently be MOCK');
  }

  if (aiParserProvider !== 'MOCK') {
    throw new Error('AI_PARSER_PROVIDER must currently be MOCK');
  }

  if (!prescriptionUploadDir.trim()) {
    throw new Error('PRESCRIPTION_UPLOAD_DIR is required');
  }

  if (jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long');
  }

  if (
    !Number.isInteger(jwtAccessTokenExpiresIn) ||
    jwtAccessTokenExpiresIn < 60
  ) {
    throw new Error(
      'JWT_EXPIRES_IN must be at least 60 seconds, for example 900 or 15m',
    );
  }

  if (
    !Number.isInteger(bcryptSaltRounds) ||
    bcryptSaltRounds < 10 ||
    bcryptSaltRounds > 15
  ) {
    throw new Error('BCRYPT_SALT_ROUNDS must be an integer between 10 and 15');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: String(port),
    AWS_REGION: awsRegion,
    DYNAMODB_USERS_TABLE_NAME: usersTableName,
    DYNAMODB_MEDICATIONS_TABLE_NAME: medicationsTableName,
    DYNAMODB_REFRESH_TOKENS_TABLE_NAME: refreshTokensTableName,
    DYNAMODB_ADHERENCE_TABLE_NAME: adherenceTableName,
    DYNAMODB_REMINDER_EVENTS_TABLE_NAME: reminderEventsTableName,
    DYNAMODB_CAREGIVER_RELATIONSHIPS_TABLE_NAME:
      caregiverRelationshipsTableName,
    DYNAMODB_PRESCRIPTION_UPLOADS_TABLE_NAME: prescriptionUploadsTableName,
    PRESCRIPTION_STORAGE_PROVIDER: prescriptionStorageProvider,
    OCR_PROVIDER: ocrProvider,
    AI_PARSER_PROVIDER: aiParserProvider,
    PRESCRIPTION_UPLOAD_DIR: prescriptionUploadDir,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_ACCESS_TOKEN_EXPIRES_IN: String(jwtAccessTokenExpiresIn),
    BCRYPT_SALT_ROUNDS: String(bcryptSaltRounds),
  };
}
