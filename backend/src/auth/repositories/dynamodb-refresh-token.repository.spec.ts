import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { DynamoDbRefreshTokenRepository } from './dynamodb-refresh-token.repository';

describe('DynamoDbRefreshTokenRepository', () => {
  it('stores a hashed token in the dedicated RefreshTokens table', async () => {
    const send = jest.fn().mockResolvedValue({});
    const dynamoDb = {
      client: { send },
      refreshTokensTableName: 'RefreshTokens',
    } as unknown as DynamoDbService;
    const repository = new DynamoDbRefreshTokenRepository(dynamoDb);

    await repository.create({
      tokenId: 'token-id',
      userId: 'user-id',
      refreshTokenHash: 'hashed-token',
      expiresAt: 1785000000000,
    });

    const command = send.mock.calls[0][0] as PutCommand;

    expect(command).toBeInstanceOf(PutCommand);
    expect(command.input.TableName).toBe('RefreshTokens');
    expect(command.input.Item).toEqual(
      expect.objectContaining({
        tokenId: 'token-id',
        userId: 'user-id',
        refreshTokenHash: 'hashed-token',
      }),
    );
  });
});
