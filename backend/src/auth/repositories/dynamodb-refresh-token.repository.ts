import { Injectable, Logger } from '@nestjs/common';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '../../database/dynamodb/dynamodb.service';
import {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from './refresh-token.repository';

@Injectable()
export class DynamoDbRefreshTokenRepository implements RefreshTokenRepository {
  private readonly logger = new Logger(DynamoDbRefreshTokenRepository.name);

  constructor(private readonly dynamoDb: DynamoDbService) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const item: RefreshTokenRecord = {
      ...input,
      createdAt: Date.now(),
    };

    this.logger.debug('Creating refresh token record');

    try {
      await this.dynamoDb.client.send(
        new PutCommand({
          TableName: this.dynamoDb.refreshTokensTableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(tokenId)',
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
          TableName: this.dynamoDb.refreshTokensTableName,
          Key: { tokenId },
          ConsistentRead: true,
        }),
      );

      return (result.Item as RefreshTokenRecord | undefined) ?? null;
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
          TableName: this.dynamoDb.refreshTokensTableName,
          Key: { tokenId },
          UpdateExpression: 'SET revokedAt = :revokedAt',
          ExpressionAttributeValues: { ':revokedAt': Date.now() },
          ConditionExpression: 'attribute_exists(tokenId)',
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

  private logFailure(operation: string, error: unknown): void {
    const message = error instanceof Error ? error.name : 'UnknownError';
    this.logger.error(`DynamoDB token ${operation} failed: ${message}`);
  }
}
