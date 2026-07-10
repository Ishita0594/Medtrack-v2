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
import { CaregiverRelationship } from '../caregiver.interface';
import {
  CaregiverRepository,
  CreateCaregiverRelationshipInput,
  UpdateCaregiverRelationshipInput,
} from './caregiver.repository';

@Injectable()
export class DynamoDbCaregiverRepository implements CaregiverRepository {
  private readonly logger = new Logger(DynamoDbCaregiverRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(
    input: CreateCaregiverRelationshipInput,
  ): Promise<CaregiverRelationship> {
    const now = Date.now();
    const relationship: CaregiverRelationship = {
      ...input,
      caregiverEmail: this.normalizeEmail(input.caregiverEmail),
      caregiverName: input.caregiverName?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.logger.debug(
      `Creating caregiver relationship ${input.relationshipId}`,
    );
    await this.dynamoDb.client.send(
      new PutCommand({
        TableName: this.dynamoDb.caregiverRelationshipsTableName,
        Item: relationship,
        ConditionExpression:
          'attribute_not_exists(patientId) AND attribute_not_exists(relationshipId)',
      }),
    );

    return relationship;
  }

  async findAllByPatientId(
    patientId: string,
  ): Promise<CaregiverRelationship[]> {
    return this.queryAll({
      KeyConditionExpression: 'patientId = :patientId',
      ExpressionAttributeValues: { ':patientId': patientId },
      ConsistentRead: true,
    });
  }

  async findByPatientAndId(
    patientId: string,
    relationshipId: string,
  ): Promise<CaregiverRelationship | null> {
    const result = await this.dynamoDb.client.send(
      new GetCommand({
        TableName: this.dynamoDb.caregiverRelationshipsTableName,
        Key: { patientId, relationshipId },
        ConsistentRead: true,
      }),
    );

    return (result.Item as CaregiverRelationship | undefined) ?? null;
  }

  async findByInviteEmailAndId(
    caregiverEmail: string,
    relationshipId: string,
  ): Promise<CaregiverRelationship | null> {
    const relationships = await this.findAllByInviteEmail(caregiverEmail);

    return (
      relationships.find(
        (relationship) => relationship.relationshipId === relationshipId,
      ) ?? null
    );
  }

  async findAllByInviteEmail(
    caregiverEmail: string,
  ): Promise<CaregiverRelationship[]> {
    return this.queryAll({
      IndexName: DYNAMODB_INDEXES.caregiverInvitesByEmail,
      KeyConditionExpression: 'caregiverEmail = :caregiverEmail',
      ExpressionAttributeValues: {
        ':caregiverEmail': this.normalizeEmail(caregiverEmail),
      },
    });
  }

  async findAllByCaregiverId(
    caregiverId: string,
  ): Promise<CaregiverRelationship[]> {
    return this.queryAll({
      IndexName: DYNAMODB_INDEXES.caregiverRelationshipsByCaregiver,
      KeyConditionExpression: 'caregiverId = :caregiverId',
      ExpressionAttributeValues: { ':caregiverId': caregiverId },
    });
  }

  async update(
    patientId: string,
    relationshipId: string,
    input: UpdateCaregiverRelationshipInput,
  ): Promise<CaregiverRelationship | null> {
    const update = this.buildUpdate(input);
    let conditionExpression =
      'attribute_exists(patientId) AND attribute_exists(relationshipId)';

    if (input.expectedStatus) {
      update.ExpressionAttributeNames['#expectedStatus'] = 'status';
      update.ExpressionAttributeValues[':expectedStatus'] =
        input.expectedStatus;
      conditionExpression += ' AND #expectedStatus = :expectedStatus';
    }

    try {
      const result = await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.caregiverRelationshipsTableName,
          Key: { patientId, relationshipId },
          ...update,
          ConditionExpression: conditionExpression,
          ReturnValues: 'ALL_NEW',
        }),
      );

      return (result.Attributes as CaregiverRelationship | undefined) ?? null;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(patientId: string, relationshipId: string): Promise<boolean> {
    try {
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.caregiverRelationshipsTableName,
          Key: { patientId, relationshipId },
          ConditionExpression:
            'attribute_exists(patientId) AND attribute_exists(relationshipId)',
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

  private async queryAll(
    input: Omit<QueryCommand['input'], 'TableName'>,
  ): Promise<CaregiverRelationship[]> {
    const relationships: CaregiverRelationship[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await this.dynamoDb.client.send(
        new QueryCommand({
          TableName: this.dynamoDb.caregiverRelationshipsTableName,
          ...input,
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      relationships.push(
        ...((result.Items as CaregiverRelationship[] | undefined) ?? []),
      );
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return relationships;
  }

  private buildUpdate(input: UpdateCaregiverRelationshipInput): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
  } {
    const values = {
      ...Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) => key !== 'expectedStatus' && value !== undefined,
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

    return {
      UpdateExpression: `SET ${assignments.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: expressionValues,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isConditionalFailure(error: unknown): boolean {
    return (
      error instanceof Error && error.name === 'ConditionalCheckFailedException'
    );
  }
}
