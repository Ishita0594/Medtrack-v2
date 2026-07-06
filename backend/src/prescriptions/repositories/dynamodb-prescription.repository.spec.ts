import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { DynamoDbPrescriptionRepository } from './dynamodb-prescription.repository';

describe('DynamoDbPrescriptionRepository', () => {
  it('queries only the authenticated user partition', async () => {
    const send = jest.fn().mockResolvedValue({ Items: [] });
    const repository = new DynamoDbPrescriptionRepository({
      client: { send },
      prescriptionUploadsTableName: 'PrescriptionUploads',
    } as unknown as DynamoDbService);

    await repository.findAllByUserId('user-id');

    const command = send.mock.calls[0][0] as QueryCommand;

    expect(command).toBeInstanceOf(QueryCommand);
    expect(command.input.TableName).toBe('PrescriptionUploads');
    expect(command.input.ExpressionAttributeValues).toEqual({
      ':userId': 'user-id',
    });
  });
});
