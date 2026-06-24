import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  DYNAMODB_CLIENT,
  DYNAMODB_DOCUMENT_CLIENT,
} from './dynamodb.constants';
import { DynamoDbService } from './dynamodb.service';

@Module({
  providers: [
    {
      provide: DYNAMODB_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new DynamoDBClient({
          region: configService.getOrThrow<string>('aws.region'),
          endpoint: configService.get<string>('aws.dynamodbEndpoint'),
        }),
    },
    {
      provide: DYNAMODB_DOCUMENT_CLIENT,
      inject: [DYNAMODB_CLIENT],
      useFactory: (client: DynamoDBClient) =>
        DynamoDBDocumentClient.from(client, {
          marshallOptions: {
            removeUndefinedValues: true,
          },
        }),
    },
    DynamoDbService,
  ],
  exports: [DynamoDbService, DYNAMODB_CLIENT, DYNAMODB_DOCUMENT_CLIENT],
})
export class DynamoDbModule {}
