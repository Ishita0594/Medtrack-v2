export const AUTH_TOKEN_TYPE = 'Bearer' as const;
export const JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;
export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;

export const AUTH_MESSAGES = {
  invalidCredentials: 'Invalid email or password',
  refreshTokenExpired: 'Refresh token has expired',
} as const;
