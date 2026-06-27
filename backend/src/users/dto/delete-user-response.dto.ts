import { ApiProperty } from '@nestjs/swagger';
import { USER_MESSAGES } from '../users.constants';

export class DeleteUserResponseDto {
  @ApiProperty({
    example: USER_MESSAGES.deleted,
    description: 'Deletion confirmation message',
  })
  message: string;
}
