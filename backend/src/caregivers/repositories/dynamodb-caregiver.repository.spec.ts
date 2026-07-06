import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { DynamoDbCaregiverRepository } from './dynamodb-caregiver.repository';

describe('DynamoDbCaregiverRepository', () => {
  const createRepository = (send: jest.Mock) =>
    new DynamoDbCaregiverRepository({
      client: { send },
      caregiverRelationshipsTableName: 'CaregiverRelationships',
    } as unknown as DynamoDbService);

  it('uses the caregiver GSI to list connected patients', async () => {
    const send = jest.fn().mockResolvedValue({ Items: [] });
    const repository = createRepository(send);

    await repository.findAllByCaregiverId('caregiver-id');

    const command = send.mock.calls[0][0] as QueryCommand;

    expect(command).toBeInstanceOf(QueryCommand);
    expect(command.input.IndexName).toBe('CaregiverRelationshipsByCaregiver');
    expect(command.input.ExpressionAttributeValues).toEqual({
      ':caregiverId': 'caregiver-id',
    });
  });

  it('uses the email GSI to resolve pending invitations', async () => {
    const send = jest.fn().mockResolvedValue({ Items: [] });
    const repository = createRepository(send);

    await repository.findByInviteEmailAndId(
      'MOTHER@TEST.COM',
      'relationship-id',
    );

    const command = send.mock.calls[0][0] as QueryCommand;

    expect(command.input.IndexName).toBe('CaregiverInvitesByEmail');
    expect(command.input.ExpressionAttributeValues).toEqual({
      ':caregiverEmail': 'mother@test.com',
    });
  });
});
