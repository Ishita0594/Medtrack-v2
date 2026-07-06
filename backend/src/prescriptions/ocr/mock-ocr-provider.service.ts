import { Injectable } from '@nestjs/common';
import { PrescriptionUpload } from '../prescription-upload.interface';
import { OcrProvider } from './ocr-provider.interface';

const MOCK_PRESCRIPTION_TEXT =
  'Tab Paracetamol 500mg twice daily for 5 days after food. ' +
  'Tab Vitamin D 1000 IU once daily for 30 days.';

@Injectable()
export class MockOcrProviderService implements OcrProvider {
  async extractText(_prescription: PrescriptionUpload): Promise<string> {
    return MOCK_PRESCRIPTION_TEXT;
  }
}
