import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { Medication } from '../medication.interface';
import {
  CreateMedicationRecordInput,
  MedicationRepository,
  UpdateMedicationRecordInput,
} from './medication.repository';

@Injectable()
export class DynamoDbMedicationRepository implements MedicationRepository {
  private readonly logger = new Logger(DynamoDbMedicationRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreateMedicationRecordInput): Promise<Medication> {
    const now = Date.now();
    const medication: Medication = {
      ...input,
      name: input.name.trim(),
      dosage: input.dosage.trim(),
      instructions: input.instructions?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.logger.debug(`Creating medication ${input.medicationId}`);
    await this.dynamoDb.client.send(
      new PutCommand({
        TableName: this.dynamoDb.medicationsTableName,
        Item: medication,
        ConditionExpression:
          'attribute_not_exists(userId) AND attribute_not_exists(medicationId)',
      }),
    );

    return medication;
  }

  async findAllByUserId(userId: string): Promise<Medication[]> {
    this.logger.debug(`Listing medications for user ${userId}`);
    const medications: Medication[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await this.dynamoDb.client.send(
        new QueryCommand({
          TableName: this.dynamoDb.medicationsTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      medications.push(...((result.Items as Medication[] | undefined) ?? []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return medications;
  }

  async findById(
    userId: string,
    medicationId: string,
  ): Promise<Medication | null> {
    this.logger.debug(`Getting medication ${medicationId}`);
    const result = await this.dynamoDb.client.send(
      new GetCommand({
        TableName: this.dynamoDb.medicationsTableName,
        Key: { userId, medicationId },
        ConsistentRead: true,
      }),
    );

    return (result.Item as Medication | undefined) ?? null;
  }

  async update(
    userId: string,
    medicationId: string,
    input: UpdateMedicationRecordInput,
  ): Promise<Medication | null> {
    const update = this.buildUpdate(input);
    this.logger.debug(`Updating medication ${medicationId}`);

    try {
      const result = await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.medicationsTableName,
          Key: { userId, medicationId },
          ...update,
          ConditionExpression:
            'attribute_exists(userId) AND attribute_exists(medicationId)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      return (result.Attributes as Medication | undefined) ?? null;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(userId: string, medicationId: string): Promise<boolean> {
    this.logger.debug(`Deleting medication ${medicationId}`);

    try {
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.medicationsTableName,
          Key: { userId, medicationId },
          ConditionExpression:
            'attribute_exists(userId) AND attribute_exists(medicationId)',
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

  private buildUpdate(input: UpdateMedicationRecordInput): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
  } {
    const values = {
      ...Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
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

    return {
      UpdateExpression: `SET ${assignments.join(', ')}`,
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
