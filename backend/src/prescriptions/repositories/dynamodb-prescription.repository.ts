import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { PrescriptionUpload } from '../prescription-upload.interface';
import {
  CreatePrescriptionInput,
  PrescriptionRepository,
  UpdatePrescriptionInput,
} from './prescription.repository';

@Injectable()
export class DynamoDbPrescriptionRepository implements PrescriptionRepository {
  private readonly logger = new Logger(DynamoDbPrescriptionRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreatePrescriptionInput): Promise<PrescriptionUpload> {
    const now = Date.now();
    const prescription: PrescriptionUpload = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.logger.debug(`Creating prescription ${input.prescriptionId}`);
    await this.dynamoDb.client.send(
      new PutCommand({
        TableName: this.dynamoDb.prescriptionUploadsTableName,
        Item: prescription,
        ConditionExpression:
          'attribute_not_exists(userId) AND attribute_not_exists(prescriptionId)',
      }),
    );

    return prescription;
  }

  async findAllByUserId(userId: string): Promise<PrescriptionUpload[]> {
    const prescriptions: PrescriptionUpload[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await this.dynamoDb.client.send(
        new QueryCommand({
          TableName: this.dynamoDb.prescriptionUploadsTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      prescriptions.push(
        ...((result.Items as PrescriptionUpload[] | undefined) ?? []),
      );
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return prescriptions;
  }

  async findById(
    userId: string,
    prescriptionId: string,
  ): Promise<PrescriptionUpload | null> {
    const result = await this.dynamoDb.client.send(
      new GetCommand({
        TableName: this.dynamoDb.prescriptionUploadsTableName,
        Key: { userId, prescriptionId },
        ConsistentRead: true,
      }),
    );

    return (result.Item as PrescriptionUpload | undefined) ?? null;
  }

  async update(
    userId: string,
    prescriptionId: string,
    input: UpdatePrescriptionInput,
  ): Promise<PrescriptionUpload | null> {
    const update = this.buildUpdate(input);
    let conditionExpression =
      'attribute_exists(userId) AND attribute_exists(prescriptionId)';

    if (input.expectedStatus) {
      update.ExpressionAttributeNames['#expectedStatus'] = 'status';
      update.ExpressionAttributeValues[':expectedStatus'] =
        input.expectedStatus;
      conditionExpression += ' AND #expectedStatus = :expectedStatus';
    }

    try {
      const result = await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.prescriptionUploadsTableName,
          Key: { userId, prescriptionId },
          ...update,
          ConditionExpression: conditionExpression,
          ReturnValues: 'ALL_NEW',
        }),
      );

      return (result.Attributes as PrescriptionUpload | undefined) ?? null;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(userId: string, prescriptionId: string): Promise<boolean> {
    try {
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.prescriptionUploadsTableName,
          Key: { userId, prescriptionId },
          ConditionExpression:
            'attribute_exists(userId) AND attribute_exists(prescriptionId)',
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

  private buildUpdate(input: UpdatePrescriptionInput): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
  } {
    const values = {
      ...Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) =>
            key !== 'clearErrorMessage' &&
            key !== 'expectedStatus' &&
            value !== undefined,
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

    if (input.clearErrorMessage) {
      names['#errorMessage'] = 'errorMessage';
      updateExpression += ' REMOVE #errorMessage';
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
