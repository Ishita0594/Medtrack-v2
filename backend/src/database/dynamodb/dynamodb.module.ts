import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  DYNAMODB_CLIENT,
  DYNAMODB_DOCUMENT_CLIENT,
} from './dynamodb.constants';
import { DynamoDbService } from './dynamodb.service';

@Global()
@Module({
  providers: [
    {
      provide: DYNAMODB_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const accessKeyId = configService.get<string>('aws.accessKeyId');
        const secretAccessKey = configService.get<string>(
          'aws.secretAccessKey',
        );
        const endpoint = configService.get<string>('aws.dynamodbEndpoint');

        return new DynamoDBClient({
          region: configService.getOrThrow<string>('aws.region'),
          ...(endpoint ? { endpoint } : {}),
          credentials:
            accessKeyId && secretAccessKey
              ? { accessKeyId, secretAccessKey }
              : undefined,
        });
      },
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
