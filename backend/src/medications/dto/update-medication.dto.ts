import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMedicationDto } from './create-medication.dto';

export class UpdateMedicationDto extends PartialType(CreateMedicationDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the medication schedule is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
