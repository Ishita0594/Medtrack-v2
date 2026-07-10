import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { MedicationFrequency } from '../../medications/enums/medication-frequency.enum';
import { PrescriptionProcessingException } from '../exceptions/prescription-processing.exception';
import { ParsedMedication } from '../parsed-medication.interface';
import { PrescriptionAiParser } from './prescription-ai-parser.interface';

type RawParsedMedication = {
  name?: unknown;
  dosage?: unknown;
  frequency?: unknown;
  times?: unknown;
  durationDays?: unknown;
  instructions?: unknown;
};

type RawParserResponse = {
  medications?: unknown;
};

const VALID_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const medicationSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'name',
    'dosage',
    'frequency',
    'times',
    'durationDays',
    'instructions',
  ],
  properties: {
    name: {
      type: 'string',
      description: 'Medication name exactly as found in the OCR text.',
    },
    dosage: {
      type: 'string',
      description: 'Medication dosage. Use "Not specified" when unclear.',
    },
    frequency: {
      type: 'string',
      enum: Object.values(MedicationFrequency),
    },
    times: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        pattern: '^(?:[01]\\d|2[0-3]):[0-5]\\d$',
      },
    },
    durationDays: {
      anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }],
      description: 'Duration converted to days, or null when not specified.',
    },
    instructions: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
  },
};

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['medications'],
  properties: {
    medications: {
      type: 'array',
      items: medicationSchema,
    },
  },
};

@Injectable()
export class OpenAiPrescriptionAiParserService implements PrescriptionAiParser {
  private readonly model: string;
  private client?: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.model =
      this.configService.get<string>('openai.model') ?? 'gpt-4o-mini';
    const apiKey = this.configService.get<string>('openai.apiKey');

    if (apiKey?.trim()) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async parse(ocrText: string): Promise<ParsedMedication[]> {
    if (!this.client) {
      throw new PrescriptionProcessingException();
    }

    let outputText: string;

    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: this.buildInstructions(),
        input: `OCR prescription text:\n${ocrText}`,
        temperature: 0,
        max_output_tokens: 1200,
        text: {
          format: {
            type: 'json_schema',
            name: 'prescription_medications',
            strict: true,
            schema: responseSchema,
          },
        },
      });
      outputText = response.output_text;
    } catch {
      throw new PrescriptionProcessingException();
    }

    return this.parseAndValidate(outputText);
  }

  private buildInstructions(): string {
    return [
      'You convert OCR text from a prescription into structured medication data.',
      'Return JSON only. Do not return markdown, commentary, or medical advice.',
      'Extract medicines only. Do not invent medications or infer medicines that are not present.',
      'Return exactly this shape: { "medications": [...] }.',
      'For unclear dosage, use "Not specified". For unclear frequency or time, use conservative defaults and explain the uncertainty in instructions.',
      'Map OD to once daily at 08:00 with DAILY. Map BD to 08:00 and 20:00 with CUSTOM. Map TDS to 08:00, 14:00, and 20:00 with CUSTOM.',
      'Map HS/night to 22:00. Map SOS/as needed to CUSTOM, choose 12:00 as the scheduling placeholder, and mention as-needed use in instructions.',
      'Convert durations such as 5 days, 1 week, or 1 month into durationDays. Use null when duration is not specified.',
      'Use HH:mm 24-hour times only.',
      `frequency must be one of: ${Object.values(MedicationFrequency).join(', ')}.`,
    ].join(' ');
  }

  private parseAndValidate(outputText: string): ParsedMedication[] {
    let payload: RawParserResponse;

    try {
      payload = JSON.parse(outputText) as RawParserResponse;
    } catch {
      throw new PrescriptionProcessingException();
    }

    if (!Array.isArray(payload.medications)) {
      throw new PrescriptionProcessingException();
    }

    const medications = payload.medications
      .map((rawMedication) =>
        this.toParsedMedication(rawMedication as RawParsedMedication),
      )
      .filter((medication): medication is ParsedMedication =>
        Boolean(medication),
      );

    if (medications.length === 0) {
      throw new PrescriptionProcessingException();
    }

    return medications;
  }

  private toParsedMedication(
    rawMedication: RawParsedMedication,
  ): ParsedMedication | null {
    if (!this.isRecord(rawMedication)) {
      return null;
    }

    const name = this.toTrimmedString(rawMedication.name);
    const dosage =
      this.toTrimmedString(rawMedication.dosage) || 'Not specified';
    const frequency = rawMedication.frequency;
    const times = rawMedication.times;

    if (
      !name ||
      !this.isMedicationFrequency(frequency) ||
      !Array.isArray(times) ||
      times.length === 0
    ) {
      return null;
    }

    const normalizedTimes = times
      .filter((time): time is string => typeof time === 'string')
      .map((time) => time.trim())
      .filter((time) => VALID_TIME_PATTERN.test(time));

    if (
      normalizedTimes.length !== times.length ||
      normalizedTimes.length === 0
    ) {
      return null;
    }

    const durationDays = this.toDurationDays(rawMedication.durationDays);

    if (
      rawMedication.durationDays !== undefined &&
      rawMedication.durationDays !== null &&
      durationDays === null
    ) {
      return null;
    }

    const instructions = this.toOptionalString(rawMedication.instructions);

    return {
      name,
      dosage,
      frequency,
      times: normalizedTimes,
      ...(durationDays ? { durationDays } : {}),
      ...(instructions ? { instructions } : {}),
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isMedicationFrequency(value: unknown): value is MedicationFrequency {
    return (
      typeof value === 'string' &&
      Object.values(MedicationFrequency).includes(value as MedicationFrequency)
    );
  }

  private toTrimmedString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private toOptionalString(value: unknown): string | undefined {
    const trimmed = this.toTrimmedString(value);
    return trimmed || undefined;
  }

  private toDurationDays(value: unknown): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      return null;
    }

    return value;
  }
}
