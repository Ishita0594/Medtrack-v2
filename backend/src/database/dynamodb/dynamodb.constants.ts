export const DYNAMODB_CLIENT = Symbol('DYNAMODB_CLIENT');
export const DYNAMODB_DOCUMENT_CLIENT = Symbol('DYNAMODB_DOCUMENT_CLIENT');

export const DYNAMODB_INDEXES = {
  usersByEmail: 'UsersByEmail',
  reminderEventsByScheduledTime: 'ReminderEventsByScheduledTime',
} as const;
