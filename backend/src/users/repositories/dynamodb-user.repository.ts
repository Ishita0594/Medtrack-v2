import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import { DYNAMODB_INDEXES } from '../../database/dynamodb/dynamodb.constants';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';
import { USER_DEFAULTS } from '../users.constants';
import { UserRecord } from '../users.types';
import {
  CreateUserRecordInput,
  UpdateUserRecordInput,
  UserRepository,
} from './user.repository';

interface UserItem extends UserRecord {
  GSI1PK: string;
  GSI1SK: 'PROFILE';
  GSI2PK: 'ENTITY#USER';
  GSI2SK: string;
}

@Injectable()
export class DynamoDbUserRepository implements UserRepository {
  private readonly logger = new Logger(DynamoDbUserRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreateUserRecordInput): Promise<UserRecord> {
    const now = Date.now();
    const email = this.normalizeEmail(input.email);
    const item: UserItem = {
      PK: this.userPk(input.userId),
      SK: 'PROFILE',
      GSI1PK: this.emailPk(email),
      GSI1SK: 'PROFILE',
      GSI2PK: 'ENTITY#USER',
      GSI2SK: `${now}#${input.userId}`,
      userId: input.userId,
      name: input.name.trim(),
      email,
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
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: this.dynamoDb.tableName,
                Item: item,
                ConditionExpression: 'attribute_not_exists(PK)',
              },
            },
            {
              Put: {
                TableName: this.dynamoDb.tableName,
                Item: {
                  PK: this.emailPk(email),
                  SK: 'CLAIM',
                  userId: input.userId,
                  createdAt: now,
                },
                ConditionExpression: 'attribute_not_exists(PK)',
              },
            },
          ],
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
          TableName: this.dynamoDb.tableName,
          Key: { PK: this.userPk(userId), SK: 'PROFILE' },
          ConsistentRead: true,
        }),
      );

      return (result.Item as UserItem | undefined) ?? null;
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
          TableName: this.dynamoDb.tableName,
          IndexName: DYNAMODB_INDEXES.email,
          KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
          ExpressionAttributeValues: {
            ':pk': this.emailPk(normalizedEmail),
            ':sk': 'PROFILE',
          },
          Limit: 1,
        }),
      );

      const indexedUser = result.Items?.[0] as UserItem | undefined;

      if (indexedUser?.email === normalizedEmail) {
        return indexedUser;
      }

      // GSI updates are eventually consistent; the claim supports immediate login.
      const claim = await this.dynamoDb.client.send(
        new GetCommand({
          TableName: this.dynamoDb.tableName,
          Key: { PK: this.emailPk(normalizedEmail), SK: 'CLAIM' },
          ConsistentRead: true,
        }),
      );
      const userId = claim.Item?.userId as string | undefined;

      return userId ? this.findById(userId) : null;
    } catch (error) {
      this.logFailure('findByEmail', undefined, error);
      throw error;
    }
  }

  async update(
    userId: string,
    input: UpdateUserRecordInput,
  ): Promise<UserRecord | null> {
    const existing = await this.findById(userId);

    if (!existing) {
      return null;
    }

    const normalizedInput = this.normalizeUpdate(input);
    const emailChanged =
      normalizedInput.email !== undefined &&
      normalizedInput.email !== existing.email;
    const update = this.buildUpdate({
      ...normalizedInput,
      ...(emailChanged
        ? { GSI1PK: this.emailPk(normalizedInput.email as string) }
        : {}),
    });

    this.logger.debug(`Updating user ${userId}`);

    try {
      if (emailChanged && normalizedInput.email) {
        await this.updateWithEmailChange(
          userId,
          existing.email,
          normalizedInput.email,
          update,
        );
      } else {
        await this.dynamoDb.client.send(
          new UpdateCommand({
            TableName: this.dynamoDb.tableName,
            Key: { PK: this.userPk(userId), SK: 'PROFILE' },
            ...update,
            ConditionExpression: 'attribute_exists(PK)',
          }),
        );
      }
    } catch (error) {
      if (this.isConditionalFailure(error)) {
        throw new UserAlreadyExistsException();
      }

      this.logFailure('update', userId, error);
      throw error;
    }

    return this.findById(userId);
  }

  async delete(userId: string): Promise<void> {
    const existing = await this.findById(userId);

    if (!existing) {
      return;
    }

    this.logger.debug(`Deleting user ${userId}`);

    try {
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.tableName,
          Key: { PK: this.userPk(userId), SK: 'PROFILE' },
          ConditionExpression: 'attribute_exists(PK)',
        }),
      );
      await this.dynamoDb.client.send(
        new DeleteCommand({
          TableName: this.dynamoDb.tableName,
          Key: { PK: this.emailPk(existing.email), SK: 'CLAIM' },
        }),
      );
    } catch (error) {
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
          new QueryCommand({
            TableName: this.dynamoDb.tableName,
            IndexName: DYNAMODB_INDEXES.users,
            KeyConditionExpression: 'GSI2PK = :pk',
            ExpressionAttributeValues: { ':pk': 'ENTITY#USER' },
            ExclusiveStartKey: exclusiveStartKey,
          }),
        );

        users.push(...((result.Items as UserItem[] | undefined) ?? []));
        exclusiveStartKey = result.LastEvaluatedKey;
      } while (exclusiveStartKey);

      return users;
    } catch (error) {
      this.logFailure('list', undefined, error);
      throw error;
    }
  }

  private async updateWithEmailChange(
    userId: string,
    oldEmail: string,
    newEmail: string,
    update: Pick<
      ReturnType<DynamoDbUserRepository['buildUpdate']>,
      keyof ReturnType<DynamoDbUserRepository['buildUpdate']>
    >,
  ): Promise<void> {
    await this.dynamoDb.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.dynamoDb.tableName,
              Item: {
                PK: this.emailPk(newEmail),
                SK: 'CLAIM',
                userId,
                createdAt: Date.now(),
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
          {
            Update: {
              TableName: this.dynamoDb.tableName,
              Key: { PK: this.userPk(userId), SK: 'PROFILE' },
              ...update,
              ConditionExpression: 'attribute_exists(PK)',
            },
          },
          {
            Delete: {
              TableName: this.dynamoDb.tableName,
              Key: { PK: this.emailPk(oldEmail), SK: 'CLAIM' },
            },
          },
        ],
      }),
    );
  }

  private buildUpdate(input: Record<string, unknown>): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
  } {
    const values: Record<string, unknown> = {
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

  private userPk(userId: string): string {
    return `USER#${userId}`;
  }

  private emailPk(email: string): string {
    return `EMAIL#${email}`;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isConditionalFailure(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.name === 'ConditionalCheckFailedException' ||
      error.name === 'TransactionCanceledException'
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
