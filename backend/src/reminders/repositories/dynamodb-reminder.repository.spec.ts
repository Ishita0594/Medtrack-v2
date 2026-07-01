import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { ReminderStatus } from '../enums/reminder-status.enum';
import { DynamoDbReminderRepository } from './dynamodb-reminder.repository';

describe('DynamoDbReminderRepository', () => {
  it('uses the scheduled-time GSI to query due pending reminders', async () => {
    const send = jest.fn().mockResolvedValue({ Items: [] });
    const dynamoDb = {
      client: { send },
      reminderEventsTableName: 'ReminderEvents',
    } as unknown as DynamoDbService;
    const repository = new DynamoDbReminderRepository(dynamoDb);

    await repository.findDuePending(1782400000000);

    const command = send.mock.calls[0][0] as QueryCommand;

    expect(command).toBeInstanceOf(QueryCommand);
    expect(command.input.IndexName).toBe('ReminderEventsByScheduledTime');
    expect(command.input.ExpressionAttributeValues).toEqual({
      ':pending': ReminderStatus.PENDING,
      ':now': 1782400000000,
    });
  });
});
