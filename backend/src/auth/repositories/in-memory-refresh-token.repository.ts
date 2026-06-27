import { Injectable } from '@nestjs/common';
import {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from './refresh-token.repository';

@Injectable()
export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly refreshTokensById = new Map<string, RefreshTokenRecord>();

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const refreshToken: RefreshTokenRecord = {
      ...input,
      createdAt: Date.now(),
    };

    this.refreshTokensById.set(input.tokenId, refreshToken);

    return refreshToken;
  }

  async findByTokenId(tokenId: string): Promise<RefreshTokenRecord | null> {
    return this.refreshTokensById.get(tokenId) ?? null;
  }

  async revoke(tokenId: string): Promise<void> {
    const refreshToken = await this.findByTokenId(tokenId);

    if (!refreshToken) {
      return;
    }

    this.refreshTokensById.set(tokenId, {
      ...refreshToken,
      revokedAt: Date.now(),
    });
  }
}
