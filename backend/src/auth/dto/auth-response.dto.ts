import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example:
      '018f6b90-5d7d-7c2a-bf2c-5c68d7d4b7f0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    description: 'Opaque refresh token. Store securely on the client.',
  })
  refreshToken: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Authorization token type',
  })
  tokenType: 'Bearer';

  @ApiProperty({
    example: 900,
    description: 'Access token lifetime in seconds',
  })
  expiresIn: number;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Authenticated user profile',
  })
  user: UserResponseDto;
}
