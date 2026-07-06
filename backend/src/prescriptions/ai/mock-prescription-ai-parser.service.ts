import { Injectable } from '@nestjs/common';
import { MedicationFrequency } from '../../medications/enums/medication-frequency.enum';
import { ParsedMedication } from '../parsed-medication.interface';
import { PrescriptionAiParser } from './prescription-ai-parser.interface';

@Injectable()
export class MockPrescriptionAiParserService implements PrescriptionAiParser {
  async parse(_ocrText: string): Promise<ParsedMedication[]> {
    return [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: MedicationFrequency.DAILY,
        times: ['08:00', '20:00'],
        durationDays: 5,
        instructions: 'Take after food',
      },
      {
        name: 'Vitamin D',
        dosage: '1000 IU',
        frequency: MedicationFrequency.DAILY,
        times: ['09:00'],
        durationDays: 30,
        instructions: 'Take once daily',
      },
    ];
  }
}
