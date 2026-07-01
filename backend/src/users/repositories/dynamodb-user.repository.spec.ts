import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { UserRole } from '../enums/user-role.enum';
import { DynamoDbUserRepository } from './dynamodb-user.repository';

describe('DynamoDbUserRepository', () => {
  const createDynamoDb = (send: jest.Mock) =>
    ({
      client: { send },
      usersTableName: 'Users',
    }) as unknown as DynamoDbService;

  it('stores only a normal user record in the Users table', async () => {
    const send = jest.fn().mockResolvedValue({});
    const repository = new DynamoDbUserRepository(createDynamoDb(send));

    await repository.create({
      userId: 'user-id',
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '+919876543210',
      role: UserRole.PATIENT,
      passwordHash: 'hashed-password',
    });

    const command = send.mock.calls[0][0] as PutCommand;

    expect(command).toBeInstanceOf(PutCommand);
    expect(command.input.TableName).toBe('Users');
    expect(command.input.Item).not.toHaveProperty('entityType');
    expect(command.input.Item?.userId).toBe('user-id');
  });

  it('uses UsersByEmail for email lookup', async () => {
    const send = jest.fn().mockResolvedValue({ Items: [] });
    const repository = new DynamoDbUserRepository(createDynamoDb(send));

    await repository.findByEmail('AARAV@example.com');

    const command = send.mock.calls[0][0] as QueryCommand;

    expect(command).toBeInstanceOf(QueryCommand);
    expect(command.input.IndexName).toBe('UsersByEmail');
    expect(command.input.ExpressionAttributeValues).toEqual({
      ':email': 'aarav@example.com',
    });
  });
});
