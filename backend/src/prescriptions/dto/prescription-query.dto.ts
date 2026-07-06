import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PrescriptionStatus } from '../enums/prescription-status.enum';

export class PrescriptionQueryDto {
  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;
}
