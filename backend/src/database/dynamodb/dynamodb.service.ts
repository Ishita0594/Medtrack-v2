import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_DOCUMENT_CLIENT } from './dynamodb.constants';

@Injectable()
export class DynamoDbService {
  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {}

  get client(): DynamoDBDocumentClient {
    return this.documentClient;
  }

  get usersTableName(): string {
    return this.configService.getOrThrow<string>('aws.usersTableName');
  }

  get medicationsTableName(): string {
    return this.configService.getOrThrow<string>('aws.medicationsTableName');
  }

  get refreshTokensTableName(): string {
    return this.configService.getOrThrow<string>('aws.refreshTokensTableName');
  }

  get adherenceTableName(): string {
    return this.configService.getOrThrow<string>('aws.adherenceTableName');
  }
}
