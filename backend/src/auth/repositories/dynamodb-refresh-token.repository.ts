import { Injectable, Logger } from '@nestjs/common';
import {
  GetCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from './refresh-token.repository';

interface RefreshTokenItem extends RefreshTokenRecord {
  PK: string;
  SK: 'METADATA';
  entityType: 'REFRESH_TOKEN';
}

@Injectable()
export class DynamoDbRefreshTokenRepository implements RefreshTokenRepository {
  private readonly logger = new Logger(DynamoDbRefreshTokenRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const item: RefreshTokenItem = {
      PK: this.tokenPk(input.tokenId),
      SK: 'METADATA',
      entityType: 'REFRESH_TOKEN',
      ...input,
      createdAt: Date.now(),
    };

    this.logger.debug('Creating refresh token record');

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
              Update: {
                TableName: this.dynamoDb.tableName,
                Key: {
                  PK: `USER#${input.userId}`,
                  SK: 'PROFILE',
                },
                UpdateExpression: 'SET refreshTokenHash = :refreshTokenHash',
                ExpressionAttributeValues: {
                  ':refreshTokenHash': input.refreshTokenHash,
                },
                ConditionExpression: 'attribute_exists(PK)',
              },
            },
          ],
        }),
      );
    } catch (error) {
      this.logFailure('create', error);
      throw error;
    }

    return item;
  }

  async findByTokenId(tokenId: string): Promise<RefreshTokenRecord | null> {
    this.logger.debug('Getting refresh token record');

    try {
      const result = await this.dynamoDb.client.send(
        new GetCommand({
          TableName: this.dynamoDb.tableName,
          Key: { PK: this.tokenPk(tokenId), SK: 'METADATA' },
          ConsistentRead: true,
        }),
      );

      return (result.Item as RefreshTokenItem | undefined) ?? null;
    } catch (error) {
      this.logFailure('findByTokenId', error);
      throw error;
    }
  }

  async revoke(tokenId: string): Promise<void> {
    this.logger.debug('Revoking refresh token record');

    try {
      await this.dynamoDb.client.send(
        new UpdateCommand({
          TableName: this.dynamoDb.tableName,
          Key: { PK: this.tokenPk(tokenId), SK: 'METADATA' },
          UpdateExpression: 'SET revokedAt = :revokedAt',
          ExpressionAttributeValues: { ':revokedAt': Date.now() },
          ConditionExpression: 'attribute_exists(PK)',
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'ConditionalCheckFailedException'
      ) {
        return;
      }

      this.logFailure('revoke', error);
      throw error;
    }
  }

  private tokenPk(tokenId: string): string {
    return `REFRESH_TOKEN#${tokenId}`;
  }

  private logFailure(operation: string, error: unknown): void {
    const message = error instanceof Error ? error.name : 'UnknownError';
    this.logger.error(`DynamoDB token ${operation} failed: ${message}`);
  }
}
