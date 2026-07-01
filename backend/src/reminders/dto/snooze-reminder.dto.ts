import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class SnoozeReminderDto {
  @ApiProperty({
    example: 1782403600000,
    description: 'Future epoch-millisecond timestamp',
  })
  @IsNumber()
  snoozedUntil: number;
}
