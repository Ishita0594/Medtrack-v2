import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdherenceStatus } from '../enums/adherence-status.enum';

export class AdherenceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by medication ID' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  medicationId?: string;

  @ApiPropertyOptional({ enum: AdherenceStatus })
  @IsOptional()
  @IsEnum(AdherenceStatus)
  status?: AdherenceStatus;

  @ApiPropertyOptional({
    example: 1782400000000,
    description: 'Inclusive scheduledAt lower bound',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  from?: number;

  @ApiPropertyOptional({
    example: 1785000000000,
    description: 'Inclusive scheduledAt upper bound',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  to?: number;
}
