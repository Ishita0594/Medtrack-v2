export const DYNAMODB_CLIENT = Symbol('DYNAMODB_CLIENT');
export const DYNAMODB_DOCUMENT_CLIENT = Symbol('DYNAMODB_DOCUMENT_CLIENT');

export const DYNAMODB_INDEXES = {
  email: 'GSI1',
  users: 'GSI2',
} as const;
