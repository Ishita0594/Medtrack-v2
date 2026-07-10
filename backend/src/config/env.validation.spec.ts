import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const baseConfig = {
    NODE_ENV: 'test',
    PORT: '3000',
    AWS_REGION: 'ap-south-1',
    JWT_SECRET: 'test-secret-with-length',
    JWT_EXPIRES_IN: '15m',
    BCRYPT_SALT_ROUNDS: '12',
  };

  it('keeps MOCK as the default AI parser provider', () => {
    const result = validateEnvironment(baseConfig);

    expect(result.AI_PARSER_PROVIDER).toBe('MOCK');
    expect(result.OPENAI_MODEL).toBe('gpt-4o-mini');
  });

  it('requires OPENAI_API_KEY when AI_PARSER_PROVIDER=OPENAI', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        AI_PARSER_PROVIDER: 'OPENAI',
      }),
    ).toThrow(
      'A real OPENAI_API_KEY is required when AI_PARSER_PROVIDER=OPENAI',
    );
  });

  it('rejects the example OpenAI API key placeholder', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        AI_PARSER_PROVIDER: 'OPENAI',
        OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY',
      }),
    ).toThrow(
      'A real OPENAI_API_KEY is required when AI_PARSER_PROVIDER=OPENAI',
    );
  });

  it('accepts OPENAI when a key and model are provided', () => {
    const result = validateEnvironment({
      ...baseConfig,
      AI_PARSER_PROVIDER: 'OPENAI',
      OPENAI_API_KEY: 'test-openai-key',
      OPENAI_MODEL: 'gpt-4o-mini',
    });

    expect(result.AI_PARSER_PROVIDER).toBe('OPENAI');
    expect(result.OPENAI_API_KEY).toBe('test-openai-key');
    expect(result.OPENAI_MODEL).toBe('gpt-4o-mini');
  });
});
