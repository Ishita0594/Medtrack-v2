import { PrescriptionUpload } from '../prescription-upload.interface';

export const OCR_PROVIDER = Symbol('OCR_PROVIDER');

export interface OcrProvider {
  extractText(prescription: PrescriptionUpload): Promise<string>;
}
