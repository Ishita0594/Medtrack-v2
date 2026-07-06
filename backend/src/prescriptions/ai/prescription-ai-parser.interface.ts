import { ParsedMedication } from '../parsed-medication.interface';

export const PRESCRIPTION_AI_PARSER = Symbol('PRESCRIPTION_AI_PARSER');

export interface PrescriptionAiParser {
  parse(ocrText: string): Promise<ParsedMedication[]>;
}
