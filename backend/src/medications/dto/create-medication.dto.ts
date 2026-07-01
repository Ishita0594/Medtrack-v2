import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Validate,
} from 'class-validator';
import { MedicationFrequency } from '../enums/medication-frequency.enum';
import { IsEndDateAfterStartDateConstraint } from '../validators/is-end-date-after-start-date.validator';

export class CreateMedicationDto {
  @ApiProperty({ example: 'Vitamin D' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  dosage: string;

  @ApiProperty({
    enum: MedicationFrequency,
    example: MedicationFrequency.DAILY,
  })
  @IsEnum(MedicationFrequency)
  frequency: MedicationFrequency;

  @ApiProperty({ example: ['08:00'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    each: true,
    message: 'each time must use valid HH:mm format',
  })
  times: string[];

  @ApiProperty({ example: 1782400000000 })
  @IsNumber()
  startDate: number;

  @ApiPropertyOptional({ example: 1785000000000 })
  @IsOptional()
  @IsNumber()
  @Validate(IsEndDateAfterStartDateConstraint)
  endDate?: number;

  @ApiPropertyOptional({ example: 'Take after breakfast' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  instructions?: string;
}
