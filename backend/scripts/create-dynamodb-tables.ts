import {
  CreateTableCommand,
  CreateTableCommandInput,
  DescribeTableCommand,
  DynamoDBClient,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { config as loadEnvironment } from 'dotenv';

loadEnvironment({ quiet: true });

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function createClient(): DynamoDBClient {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const endpoint = process.env.DYNAMODB_ENDPOINT?.trim();

  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error(
      'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together',
    );
  }

  return new DynamoDBClient({
    region: requiredEnvironment('AWS_REGION'),
    ...(endpoint ? { endpoint } : {}),
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
  });
}

async function tableExists(
  client: DynamoDBClient,
  tableName: string,
): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      return false;
    }

    throw error;
  }
}

async function ensureTable(
  client: DynamoDBClient,
  definition: CreateTableCommandInput,
): Promise<void> {
  const tableName = definition.TableName;

  if (!tableName) {
    throw new Error('TableName is required');
  }

  if (await tableExists(client, tableName)) {
    console.log(`[skip] ${tableName} already exists`);
    return;
  }

  console.log(`[create] Creating ${tableName}`);

  try {
    await client.send(new CreateTableCommand(definition));
  } catch (error) {
    if (error instanceof Error && error.name === 'ResourceInUseException') {
      console.log(`[skip] ${tableName} was created by another process`);
      return;
    }

    throw error;
  }

  await waitUntilTableExists(
    { client, maxWaitTime: 180 },
    { TableName: tableName },
  );
  console.log(`[ready] ${tableName}`);
}

async function main(): Promise<void> {
  const client = createClient();

  try {
    const usersTableName = requiredEnvironment('DYNAMODB_USERS_TABLE_NAME');
    const medicationsTableName = requiredEnvironment(
      'DYNAMODB_MEDICATIONS_TABLE_NAME',
    );
    const refreshTokensTableName = requiredEnvironment(
      'DYNAMODB_REFRESH_TOKENS_TABLE_NAME',
    );
    const adherenceTableName = requiredEnvironment(
      'DYNAMODB_ADHERENCE_TABLE_NAME',
    );
    const reminderEventsTableName = requiredEnvironment(
      'DYNAMODB_REMINDER_EVENTS_TABLE_NAME',
    );
    const caregiverRelationshipsTableName = requiredEnvironment(
      'DYNAMODB_CAREGIVER_RELATIONSHIPS_TABLE_NAME',
    );
    const prescriptionUploadsTableName = requiredEnvironment(
      'DYNAMODB_PRESCRIPTION_UPLOADS_TABLE_NAME',
    );

    console.log('Initializing DynamoDB tables');

    await ensureTable(client, {
      TableName: usersTableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UsersByEmail',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    });

    await ensureTable(client, {
      TableName: medicationsTableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'medicationId', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'medicationId', KeyType: 'RANGE' },
      ],
    });

    await ensureTable(client, {
      TableName: refreshTokensTableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'tokenId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'tokenId', KeyType: 'HASH' }],
    });

    await ensureTable(client, {
      TableName: adherenceTableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'recordId', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'recordId', KeyType: 'RANGE' },
      ],
    });

    await ensureTable(client, {
      TableName: reminderEventsTableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'reminderId', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'scheduledAt', AttributeType: 'N' },
      ],
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'reminderId', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'ReminderEventsByScheduledTime',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' },
            { AttributeName: 'scheduledAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    });

    await ensureTable(client, {
      TableName: caregiverRelationshipsTableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'patientId', AttributeType: 'S' },
        { AttributeName: 'relationshipId', AttributeType: 'S' },
        { AttributeName: 'caregiverId', AttributeType: 'S' },
        { AttributeName: 'caregiverEmail', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'N' },
        { AttributeName: 'invitedAt', AttributeType: 'N' },
      ],
      KeySchema: [
        { AttributeName: 'patientId', KeyType: 'HASH' },
        { AttributeName: 'relationshipId', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CaregiverRelationshipsByCaregiver',
          KeySchema: [
            { AttributeName: 'caregiverId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'CaregiverInvitesByEmail',
          KeySchema: [
            { AttributeName: 'caregiverEmail', KeyType: 'HASH' },
            { AttributeName: 'invitedAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    });

    await ensureTable(client, {
      TableName: prescriptionUploadsTableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'prescriptionId', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'prescriptionId', KeyType: 'RANGE' },
      ],
    });

    console.log('DynamoDB initialization complete');
  } finally {
    client.destroy();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`DynamoDB initialization failed: ${message}`);
  process.exitCode = 1;
});
