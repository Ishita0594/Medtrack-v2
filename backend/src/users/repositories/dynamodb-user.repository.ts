import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_INDEXES } from '../../database/dynamodb/dynamodb.constants';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';
import { USER_DEFAULTS } from '../users.constants';
import { UserRecord } from '../users.types';
import {
  CreateUserRecordInput,
  UpdateUserRecordInput,
  UserRepository,
} from './user.repository';

@Injectable()
export class DynamoDbUserRepository implements UserRepository {
  private readonly logger = new Logger(DynamoDbUserRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreateUserRecordInput): Promise<UserRecord> {
    const now = Date.now();
    const item: UserRecord = {
      userId: input.userId,
      name: input.name.trim(),
      email: this.normalizeEmail(input.email),
      phone: input.phone.trim(),
      role: input.role,
      passwordHash: input.passwordHash,
      isActive: input.isActive ?? USER_DEFAULTS.isActive,
      emailVerified: input.emailVerified ?? USER_DEFAULTS.emailVerified,
      createdAt: now,
      updatedAt: now,
    };

    this.logger.debug(`Creating user ${input.userId}`);

    try {
      await this.dynamoDb.client.send(
        new PutCommand({
          TableName: this.dynamoDb.usersTableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(userId)',
        }),
      );
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        throw new UserAlreadyExistsException();
      }

      this.logFailure('create', input.userId, error);
      throw error;
    }

    return item;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    this.logger.debug(`Getting user ${userId}`);

    try {
      const result = await this.dynamoDb.client.send(
        new GetCommand({
          TableName: this.dynamoDb.usersTableName,
          Key: { userId },
          ConsistentRead: true,
        }),
      );
      const item = result.Item;

      return this.isUserRecord(item) ? item : null;
    } catch (error) {
      this.logFailure('findById', userId, error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = this.normalizeEmail(email);
    this.logger.debug('Querying user by normalized email');

    try {
      const result = await this.dynamoDb.client.send(
        new QueryCommand({
          TableName: this.dynamoDb.usersTableName,
          IndexName: DYNAMODB_INDEXES.usersByEmail,
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': normalizedEmail },
          Limit: 1,
        }),
      );

      return (result.Items?.[0] as UserRecord | undefined) ?? null;
    } catch (error) {
      this.logFailure('findByEmail', undefined, error);
      throw error;
    }
  }

  async update(
    userId: string,
    input: UpdateUserRecordInput,
  ): Promise<UserRecord | null> {
    const update = this.buildUpdate(this.normalizeUpdate(input));
    this.logger.debug(`Updating user ${userId}`);

    try {
      const result = await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.usersTableName,
          Key: { userId },
          ...update,
          ConditionExpression: 'attribute_exists(userId)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      return (result.Attributes as UserRecord | undefined) ?? null;
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return null;
      }

      this.logFailure('update', userId, error);
      throw error;
    }
  }

  async delete(userId: string): Promise<void> {
    this.logger.debug(`Deleting user ${userId}`);

    try {
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.usersTableName,
          Key: { userId },
          ConditionExpression: 'attribute_exists(userId)',
        }),
      );
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        return;
      }

      this.logFailure('delete', userId, error);
      throw error;
    }
  }

  async list(): Promise<UserRecord[]> {
    this.logger.debug('Listing users');

    try {
      const users: UserRecord[] = [];
      let exclusiveStartKey: Record<string, unknown> | undefined;

      do {
        const result = await this.dynamoDb.client.send(
          new ScanCommand({
            TableName: this.dynamoDb.usersTableName,
            FilterExpression:
              'attribute_exists(email) AND attribute_exists(#name) AND attribute_exists(#role)',
            ExpressionAttributeNames: {
              '#name': 'name',
              '#role': 'role',
            },
            ExclusiveStartKey: exclusiveStartKey,
          }),
        );

        users.push(...((result.Items as UserRecord[] | undefined) ?? []));
        exclusiveStartKey = result.LastEvaluatedKey;
      } while (exclusiveStartKey);

      return users;
    } catch (error) {
      this.logFailure('list', undefined, error);
      throw error;
    }
  }

  private buildUpdate(input: UpdateUserRecordInput): {
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

  private normalizeUpdate(input: UpdateUserRecordInput): UpdateUserRecordInput {
    return {
      ...input,
      name: input.name?.trim(),
      email: input.email ? this.normalizeEmail(input.email) : undefined,
      phone: input.phone?.trim(),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUserRecord(item: unknown): item is UserRecord {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const record = item as Partial<UserRecord>;

    return (
      typeof record.userId === 'string' &&
      typeof record.name === 'string' &&
      typeof record.email === 'string' &&
      typeof record.phone === 'string' &&
      typeof record.role === 'string'
    );
  }

  private isConditionalFailure(error: unknown): boolean {
    return (
      error instanceof Error && error.name === 'ConditionalCheckFailedException'
    );
  }

  private logFailure(
    operation: string,
    userId: string | undefined,
    error: unknown,
  ): void {
    const context = userId ? ` for user ${userId}` : '';
    const message = error instanceof Error ? error.name : 'UnknownError';
    this.logger.error(`DynamoDB ${operation}${context} failed: ${message}`);
  }
}
