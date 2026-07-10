import { MedicationFrequency } from '../../medications/enums/medication-frequency.enum';
import { MockPrescriptionAiParserService } from './mock-prescription-ai-parser.service';

describe('MockPrescriptionAiParserService', () => {
  it('returns deterministic parsed medications', async () => {
    const service = new MockPrescriptionAiParserService();

    const medications = await service.parse('mock OCR text');

    expect(medications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: MedicationFrequency.DAILY,
        }),
      ]),
    );
  });
});
