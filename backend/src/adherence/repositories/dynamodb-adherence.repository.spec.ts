import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { DynamoDbAdherenceRepository } from './dynamodb-adherence.repository';

describe('DynamoDbAdherenceRepository', () => {
  it('queries the authenticated user partition without scanning', async () => {
    const send = jest.fn().mockResolvedValue({ Items: [] });
    const dynamoDb = {
      client: { send },
      adherenceTableName: 'AdherenceRecords',
    } as unknown as DynamoDbService;
    const repository = new DynamoDbAdherenceRepository(dynamoDb);

    await repository.findAllByUserId('user-id');

    const command = send.mock.calls[0][0] as QueryCommand;

    expect(command).toBeInstanceOf(QueryCommand);
    expect(command.input.TableName).toBe('AdherenceRecords');
    expect(command.input.ExpressionAttributeValues).toEqual({
      ':userId': 'user-id',
    });
  });
});
