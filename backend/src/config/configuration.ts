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
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    accessTokenExpiresIn: Number(
      process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? 900,
    ),
  },
  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  },
});
