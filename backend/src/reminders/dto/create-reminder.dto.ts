import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateReminderDto {
  @ApiProperty({
    example: '01972e26-4d7a-7f47-a38e-04dd8a0fb731',
    description: 'Medication owned by the authenticated user',
  })
  @IsString()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({
    example: 1782400000000,
    description: 'Reminder time as epoch milliseconds',
  })
  @IsNumber()
  scheduledAt: number;

  @ApiProperty({ enum: NotificationType, example: NotificationType.IN_APP })
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiPropertyOptional({ example: 'Morning reminder' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  notes?: string;
}
