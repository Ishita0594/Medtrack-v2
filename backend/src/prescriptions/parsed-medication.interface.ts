import { MedicationFrequency } from '../medications/enums/medication-frequency.enum';

export interface ParsedMedication {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  durationDays: number;
  instructions?: string;
}
