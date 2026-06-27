export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRecord {
  tokenId: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: number;
  createdAt: number;
  revokedAt?: number;
}

export interface CreateRefreshTokenInput {
  tokenId: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: number;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  findByTokenId(tokenId: string): Promise<RefreshTokenRecord | null>;
  revoke(tokenId: string): Promise<void>;
}
