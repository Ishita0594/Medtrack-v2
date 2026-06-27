export const USER_ENTITY = 'USER';

export const USER_DEFAULTS = {
  isActive: true,
  emailVerified: false,
} as const;

export const USER_MESSAGES = {
  alreadyExists: 'Email is already registered',
  notFound: 'User not found',
  deleted: 'User deleted successfully',
} as const;
