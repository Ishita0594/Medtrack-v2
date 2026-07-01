import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ReminderStatus } from '../enums/reminder-status.enum';

export class ReminderQueryDto {
  @ApiPropertyOptional({ description: 'Filter by medication ID' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  medicationId?: string;

  @ApiPropertyOptional({ enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @ApiPropertyOptional({ example: 1782400000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  from?: number;

  @ApiPropertyOptional({ example: 1785000000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  to?: number;

  @ApiPropertyOptional({ example: '2026-06-25' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateKey must use YYYY-MM-DD format',
  })
  dateKey?: string;
}
