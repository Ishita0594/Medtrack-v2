import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { AdherenceRecord } from '../adherence.interface';
import {
  AdherenceRepository,
  CreateAdherenceRecordInput,
  UpdateAdherenceRecordInput,
} from './adherence.repository';

@Injectable()
export class DynamoDbAdherenceRepository implements AdherenceRepository {
  private readonly logger = new Logger(DynamoDbAdherenceRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreateAdherenceRecordInput): Promise<AdherenceRecord> {
    const now = Date.now();
    const record: AdherenceRecord = {
      ...input,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.logger.debug(`Creating adherence record ${input.recordId}`);
    await this.dynamoDb.client.send(
      new PutCommand({
        TableName: this.dynamoDb.adherenceTableName,
        Item: record,
        ConditionExpression:
          'attribute_not_exists(userId) AND attribute_not_exists(recordId)',
      }),
    );

    return record;
  }

  async findAllByUserId(userId: string): Promise<AdherenceRecord[]> {
    this.logger.debug(`Listing adherence records for user ${userId}`);
    const records: AdherenceRecord[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await this.dynamoDb.client.send(
        new QueryCommand({
          TableName: this.dynamoDb.adherenceTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      records.push(...((result.Items as AdherenceRecord[] | undefined) ?? []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return records;
  }

  async findById(
    userId: string,
    recordId: string,
  ): Promise<AdherenceRecord | null> {
    this.logger.debug(`Getting adherence record ${recordId}`);
    const result = await this.dynamoDb.client.send(
      new GetCommand({
        TableName: this.dynamoDb.adherenceTableName,
        Key: { userId, recordId },
        ConsistentRead: true,
      }),
    );

    return (result.Item as AdherenceRecord | undefined) ?? null;
  }

  async update(
    userId: string,
    recordId: string,
    input: UpdateAdherenceRecordInput,
  ): Promise<AdherenceRecord | null> {
    const update = this.buildUpdate(input);
    this.logger.debug(`Updating adherence record ${recordId}`);

    try {
      const result = await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.adherenceTableName,
          Key: { userId, recordId },
          ...update,
          ConditionExpression:
            'attribute_exists(userId) AND attribute_exists(recordId)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      return (result.Attributes as AdherenceRecord | undefined) ?? null;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(userId: string, recordId: string): Promise<boolean> {
    this.logger.debug(`Deleting adherence record ${recordId}`);

    try {
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.adherenceTableName,
          Key: { userId, recordId },
          ConditionExpression:
            'attribute_exists(userId) AND attribute_exists(recordId)',
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

  private buildUpdate(input: UpdateAdherenceRecordInput): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
  } {
    const values = {
      ...Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) => key !== 'clearTakenAt' && value !== undefined,
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

    if (input.clearTakenAt) {
      names['#takenAt'] = 'takenAt';
      updateExpression += ' REMOVE #takenAt';
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
