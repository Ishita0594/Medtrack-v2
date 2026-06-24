const allowedNodeEnvs = ['development', 'test', 'staging', 'production'];

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const port = Number(config.PORT ?? 3000);
  const awsRegion = String(config.AWS_REGION ?? 'ap-south-1');
  const jwtSecret = String(config.JWT_SECRET ?? 'change-me-in-production');
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

  if (jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long');
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
    JWT_SECRET: jwtSecret,
    BCRYPT_SALT_ROUNDS: String(bcryptSaltRounds),
  };
}
