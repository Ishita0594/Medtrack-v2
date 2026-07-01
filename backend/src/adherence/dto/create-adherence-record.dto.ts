import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdherenceStatus } from '../enums/adherence-status.enum';

export class CreateAdherenceRecordDto {
  @ApiProperty({
    example: '01972e26-4d7a-7f47-a38e-04dd8a0fb731',
    description: 'Medication owned by the authenticated user',
  })
  @IsString()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({
    example: 1782400000000,
    description: 'Scheduled dose time as epoch milliseconds',
  })
  @IsNumber()
  scheduledAt: number;

  @ApiProperty({ enum: AdherenceStatus, example: AdherenceStatus.TAKEN })
  @IsEnum(AdherenceStatus)
  status: AdherenceStatus;

  @ApiPropertyOptional({
    example: 1782400300000,
    description: 'Actual dose time as epoch milliseconds',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  takenAt?: number | null;

  @ApiPropertyOptional({ example: 'Taken after breakfast' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  notes?: string;
}
