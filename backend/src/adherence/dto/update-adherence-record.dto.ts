import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AdherenceStatus } from '../enums/adherence-status.enum';

export class UpdateAdherenceRecordDto {
  @ApiPropertyOptional({
    enum: AdherenceStatus,
    example: AdherenceStatus.TAKEN,
  })
  @IsOptional()
  @IsEnum(AdherenceStatus)
  status?: AdherenceStatus;

  @ApiPropertyOptional({
    example: 1782400300000,
    description: 'Set null to clear the actual dose time',
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
