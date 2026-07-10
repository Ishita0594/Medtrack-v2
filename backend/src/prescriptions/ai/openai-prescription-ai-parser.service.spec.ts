import { ConfigService } from '@nestjs/config';
import { MedicationFrequency } from '../../medications/enums/medication-frequency.enum';
import { PrescriptionProcessingException } from '../exceptions/prescription-processing.exception';
import { OpenAiPrescriptionAiParserService } from './openai-prescription-ai-parser.service';

type MockOpenAiClient = {
  responses: {
    create: jest.Mock;
  };
};

describe('OpenAiPrescriptionAiParserService', () => {
  let client: MockOpenAiClient;
  let service: OpenAiPrescriptionAiParserService;

  beforeEach(() => {
    client = {
      responses: {
        create: jest.fn(),
      },
    };
    service = new OpenAiPrescriptionAiParserService(
      createConfigService({
        'openai.apiKey': 'test-key',
        'openai.model': 'gpt-4o-mini',
      }),
    );
    (service as unknown as { client: MockOpenAiClient }).client = client;
  });

  it('builds with a mocked OpenAI client and parses valid structured output', async () => {
    client.responses.create.mockResolvedValue({
      output_text: JSON.stringify({
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            frequency: MedicationFrequency.CUSTOM,
            times: ['08:00', '20:00'],
            durationDays: 7,
            instructions: 'Take after food',
          },
        ],
      }),
    });

    const result = await service.parse('Rx Amoxicillin 500mg BD 7 days');

    expect(client.responses.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        text: expect.objectContaining({
          format: expect.objectContaining({
            type: 'json_schema',
            strict: true,
          }),
        }),
      }),
    );
    expect(result).toEqual([
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: MedicationFrequency.CUSTOM,
        times: ['08:00', '20:00'],
        durationDays: 7,
        instructions: 'Take after food',
      },
    ]);
  });

  it('handles invalid JSON safely', async () => {
    client.responses.create.mockResolvedValue({ output_text: 'not-json' });

    await expect(service.parse('OCR text')).rejects.toBeInstanceOf(
      PrescriptionProcessingException,
    );
  });

  it('rejects invalid medication entries and keeps valid ones', async () => {
    client.responses.create.mockResolvedValue({
      output_text: JSON.stringify({
        medications: [
          {
            name: '',
            dosage: '500mg',
            frequency: MedicationFrequency.DAILY,
            times: ['08:00'],
            durationDays: 5,
            instructions: null,
          },
          {
            name: 'Cetirizine',
            dosage: '',
            frequency: MedicationFrequency.DAILY,
            times: ['22:00'],
            durationDays: null,
            instructions: 'At night',
          },
        ],
      }),
    });

    const result = await service.parse('OCR text');

    expect(result).toEqual([
      {
        name: 'Cetirizine',
        dosage: 'Not specified',
        frequency: MedicationFrequency.DAILY,
        times: ['22:00'],
        instructions: 'At night',
      },
    ]);
  });

  it('throws when no valid medications remain', async () => {
    client.responses.create.mockResolvedValue({
      output_text: JSON.stringify({
        medications: [
          {
            name: 'Bad Time',
            dosage: '10mg',
            frequency: MedicationFrequency.DAILY,
            times: ['99:99'],
            durationDays: 3,
            instructions: null,
          },
        ],
      }),
    });

    await expect(service.parse('OCR text')).rejects.toBeInstanceOf(
      PrescriptionProcessingException,
    );
  });

  it('throws a safe processing exception when OpenAI fails', async () => {
    client.responses.create.mockRejectedValue(
      new Error('provider secret error'),
    );

    await expect(service.parse('OCR text')).rejects.toMatchObject({
      message: 'Prescription processing failed',
    });
  });

  it('throws safely when no OpenAI client is configured', async () => {
    const serviceWithoutClient = new OpenAiPrescriptionAiParserService(
      createConfigService({ 'openai.model': 'gpt-4o-mini' }),
    );

    await expect(serviceWithoutClient.parse('OCR text')).rejects.toBeInstanceOf(
      PrescriptionProcessingException,
    );
  });

  function createConfigService(values: Record<string, string>): ConfigService {
    return {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
  }
});
