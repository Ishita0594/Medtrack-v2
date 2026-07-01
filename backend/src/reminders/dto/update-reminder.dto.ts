import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { ReminderStatus } from '../enums/reminder-status.enum';

export class UpdateReminderDto {
  @ApiPropertyOptional({ example: 1782400000000 })
  @IsOptional()
  @IsNumber()
  scheduledAt?: number;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  notificationType?: NotificationType;

  @ApiPropertyOptional({ enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @ApiPropertyOptional({ example: 'Updated reminder note' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  notes?: string;
}
