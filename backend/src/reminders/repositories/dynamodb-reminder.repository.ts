import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_INDEXES } from '../../database/dynamodb/dynamodb.constants';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { ReminderStatus } from '../enums/reminder-status.enum';
import { Reminder } from '../reminder.interface';
import {
  CreateReminderRecordInput,
  ReminderRepository,
  UpdateReminderRecordInput,
} from './reminder.repository';

@Injectable()
export class DynamoDbReminderRepository implements ReminderRepository {
  private readonly logger = new Logger(DynamoDbReminderRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreateReminderRecordInput): Promise<Reminder> {
    const now = Date.now();
    const reminder: Reminder = {
      ...input,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.logger.debug(`Creating reminder ${input.reminderId}`);
    await this.dynamoDb.client.send(
      new PutCommand({
        TableName: this.dynamoDb.reminderEventsTableName,
        Item: reminder,
        ConditionExpression:
          'attribute_not_exists(userId) AND attribute_not_exists(reminderId)',
      }),
    );

    return reminder;
  }

  async findAllByUserId(userId: string): Promise<Reminder[]> {
    this.logger.debug(`Listing reminders for user ${userId}`);
    const reminders: Reminder[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await this.dynamoDb.client.send(
        new QueryCommand({
          TableName: this.dynamoDb.reminderEventsTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      reminders.push(...((result.Items as Reminder[] | undefined) ?? []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return reminders;
  }

  async findById(userId: string, reminderId: string): Promise<Reminder | null> {
    this.logger.debug(`Getting reminder ${reminderId}`);
    const result = await this.dynamoDb.client.send(
      new GetCommand({
        TableName: this.dynamoDb.reminderEventsTableName,
        Key: { userId, reminderId },
        ConsistentRead: true,
      }),
    );

    return (result.Item as Reminder | undefined) ?? null;
  }

  async update(
    userId: string,
    reminderId: string,
    input: UpdateReminderRecordInput,
  ): Promise<Reminder | null> {
    const update = this.buildUpdate(input);
    this.logger.debug(`Updating reminder ${reminderId}`);

    try {
      const result = await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.reminderEventsTableName,
          Key: { userId, reminderId },
          ...update,
          ConditionExpression:
            'attribute_exists(userId) AND attribute_exists(reminderId)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      return (result.Attributes as Reminder | undefined) ?? null;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(userId: string, reminderId: string): Promise<boolean> {
    this.logger.debug(`Deleting reminder ${reminderId}`);

    try {
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.reminderEventsTableName,
          Key: { userId, reminderId },
          ConditionExpression:
            'attribute_exists(userId) AND attribute_exists(reminderId)',
        }),
      );

      return true;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return false;
      }

      throw error;
    }
  }

  async findDuePending(now: number): Promise<Reminder[]> {
    this.logger.debug('Querying due pending reminders');
    const reminders: Reminder[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await this.dynamoDb.client.send(
        new QueryCommand({
          TableName: this.dynamoDb.reminderEventsTableName,
          IndexName: DYNAMODB_INDEXES.reminderEventsByScheduledTime,
          KeyConditionExpression: '#status = :pending AND scheduledAt <= :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':pending': ReminderStatus.PENDING,
            ':now': now,
          },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      reminders.push(...((result.Items as Reminder[] | undefined) ?? []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return reminders.filter(
      (reminder) =>
        reminder.snoozedUntil === undefined || reminder.snoozedUntil <= now,
    );
  }

  async claimAsSent(
    userId: string,
    reminderId: string,
    now: number,
  ): Promise<Reminder | null> {
    try {
      const result = await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.reminderEventsTableName,
          Key: { userId, reminderId },
          UpdateExpression:
            'SET #status = :sent, sentAt = :now, updatedAt = :now',
          ConditionExpression:
            '#status = :pending AND scheduledAt <= :now AND (attribute_not_exists(snoozedUntil) OR snoozedUntil <= :now)',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':pending': ReminderStatus.PENDING,
            ':sent': ReminderStatus.SENT,
            ':now': now,
          },
          ReturnValues: 'ALL_NEW',
        }),
      );

      return (result.Attributes as Reminder | undefined) ?? null;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return null;
      }

      throw error;
    }
  }

  private buildUpdate(input: UpdateReminderRecordInput): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
  } {
    const values = {
      ...Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) => key !== 'clearSentAt' && value !== undefined,
        ),
      ),
      updatedAt: Date.now(),
    };
    const names: Record<string, string> = {};
    const expressionValues: Record<string, unknown> = {};
    const assignments = Object.entries(values).map(([key, value], index) => {
      const name = `#field${index}`;
      const valueKey = `:value${index}`;
      names[name] = key;
      expressionValues[valueKey] = value;
      return `${name} = ${valueKey}`;
    });
    let updateExpression = `SET ${assignments.join(', ')}`;

    if (input.clearSentAt) {
      names['#sentAt'] = 'sentAt';
      updateExpression += ' REMOVE #sentAt';
    }

    return {
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: expressionValues,
    };
  }

  private isConditionalFailure(error: unknown): boolean {
    return (
      error instanceof Error && error.name === 'ConditionalCheckFailedException'
    );
  }
}
