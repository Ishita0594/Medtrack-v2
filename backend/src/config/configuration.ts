export default () => ({
  app: {
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'ap-south-1',
    dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT,
    dynamodbTablePrefix: process.env.DYNAMODB_TABLE_PREFIX ?? 'medtrack_',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m',
  },
  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  },
});
