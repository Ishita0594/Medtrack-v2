import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicationFrequency } from '../../medications/enums/medication-frequency.enum';

export class ParsedMedicationDto {
  @ApiProperty({ example: 'Paracetamol' })
  name: string;

  @ApiProperty({ example: '500mg' })
  dosage: string;

  @ApiProperty({
    enum: MedicationFrequency,
    example: MedicationFrequency.DAILY,
  })
  frequency: MedicationFrequency;

  @ApiProperty({ example: ['08:00', '20:00'], type: [String] })
  times: string[];

  @ApiProperty({ example: 5 })
  durationDays: number;

  @ApiPropertyOptional({ example: 'Take after food' })
  instructions?: string;
}
