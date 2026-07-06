jest.mock('uuid', () => ({
  v7: jest.fn(() => '01972ea0-e9bf-7707-bc34-f957a2aae522'),
}));

import { MedicationFrequency } from '../medications/enums/medication-frequency.enum';
import { MedicationsService } from '../medications/medications.service';
import { PrescriptionFileType } from './enums/prescription-file-type.enum';
import { PrescriptionStatus } from './enums/prescription-status.enum';
import { PrescriptionStorageProvider } from './enums/prescription-storage-provider.enum';
import { InvalidPrescriptionFileException } from './exceptions/invalid-prescription-file.exception';
import { PrescriptionProcessingException } from './exceptions/prescription-processing.exception';
import type { OcrProvider } from './ocr/ocr-provider.interface';
import type { PrescriptionAiParser } from './ai/prescription-ai-parser.interface';
import { ParsedMedication } from './parsed-medication.interface';
import { PrescriptionUpload } from './prescription-upload.interface';
import { PrescriptionsService } from './prescriptions.service';
import type { PrescriptionRepository } from './repositories/prescription.repository';
import type { PrescriptionStorage } from './storage/prescription-storage.interface';

describe('PrescriptionsService', () => {
  const userId = 'user-id';
  const prescriptionId = '01972ea0-e9bf-7707-bc34-f957a2aae522';
  const parsedMedications: ParsedMedication[] = [
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
    },
  ];
  const uploaded: PrescriptionUpload = {
    prescriptionId,
    userId,
    originalFileName: 'prescription.pdf',
    fileType: PrescriptionFileType.PDF,
    mimeType: 'application/pdf',
    fileSize: 100,
    storageProvider: PrescriptionStorageProvider.LOCAL,
    storageKey: 'user-id/prescription-id/prescription.pdf',
    status: PrescriptionStatus.UPLOADED,
    createdAt: 1782000000000,
    updatedAt: 1782000000000,
  };
  let repository: jest.Mocked<PrescriptionRepository>;
  let storage: jest.Mocked<PrescriptionStorage>;
  let ocrProvider: jest.Mocked<OcrProvider>;
  let aiParser: jest.Mocked<PrescriptionAiParser>;
  let medicationsService: jest.Mocked<Pick<MedicationsService, 'create'>>;
  let service: PrescriptionsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    storage = {
      store: jest.fn(),
      delete: jest.fn(),
    };
    ocrProvider = { extractText: jest.fn() };
    aiParser = { parse: jest.fn() };
    medicationsService = { create: jest.fn() };
    service = new PrescriptionsService(
      repository,
      storage,
      ocrProvider,
      aiParser,
      medicationsService as unknown as MedicationsService,
    );
  });

  it('stores a valid upload and creates metadata', async () => {
    const file = createFile();
    storage.store.mockResolvedValue({
      storageProvider: PrescriptionStorageProvider.LOCAL,
      storageKey: uploaded.storageKey,
    });
    repository.create.mockResolvedValue(uploaded);

    await service.upload(userId, file);

    expect(storage.store).toHaveBeenCalledWith(userId, prescriptionId, file);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        prescriptionId,
        userId,
        fileType: PrescriptionFileType.PDF,
        status: PrescriptionStatus.UPLOADED,
      }),
    );
  });

  it('rejects an unsupported file type', async () => {
    await expect(
      service.upload(userId, createFile('text/plain')),
    ).rejects.toBeInstanceOf(InvalidPrescriptionFileException);
  });

  it('processes OCR output and creates medications', async () => {
    const processing = {
      ...uploaded,
      status: PrescriptionStatus.PROCESSING,
    };
    const processed = {
      ...processing,
      status: PrescriptionStatus.PROCESSED,
      ocrText: 'mock text',
      aiParsedMedications: parsedMedications,
      createdMedicationIds: ['med-1', 'med-2'],
      processedAt: 1782000300000,
    };
    repository.findById.mockResolvedValue(uploaded);
    repository.update
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(processed);
    ocrProvider.extractText.mockResolvedValue('mock text');
    aiParser.parse.mockResolvedValue(parsedMedications);
    medicationsService.create
      .mockResolvedValueOnce({ medicationId: 'med-1' } as never)
      .mockResolvedValueOnce({ medicationId: 'med-2' } as never);

    const result = await service.process(userId, prescriptionId);

    expect(result.createdMedicationIds).toEqual(['med-1', 'med-2']);
    expect(medicationsService.create).toHaveBeenCalledTimes(2);
  });

  it('reprocesses without duplicating existing medications', async () => {
    const existing = {
      ...uploaded,
      status: PrescriptionStatus.PROCESSED,
      createdMedicationIds: ['med-1', 'med-2'],
    };
    const processing = {
      ...existing,
      status: PrescriptionStatus.PROCESSING,
    };
    const processed = {
      ...processing,
      status: PrescriptionStatus.PROCESSED,
      ocrText: 'mock text',
      aiParsedMedications: parsedMedications,
      processedAt: 1782000300000,
    };
    repository.findById.mockResolvedValue(existing);
    repository.update
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(processed);
    ocrProvider.extractText.mockResolvedValue('mock text');
    aiParser.parse.mockResolvedValue(parsedMedications);

    await service.reprocess(userId, prescriptionId);

    expect(medicationsService.create).not.toHaveBeenCalled();
  });

  it('persists FAILED status when processing throws', async () => {
    repository.findById.mockResolvedValue(uploaded);
    repository.update.mockResolvedValue({
      ...uploaded,
      status: PrescriptionStatus.PROCESSING,
    });
    ocrProvider.extractText.mockRejectedValue(new Error('provider failed'));

    await expect(
      service.process(userId, prescriptionId),
    ).rejects.toBeInstanceOf(PrescriptionProcessingException);
    expect(repository.update).toHaveBeenLastCalledWith(
      userId,
      prescriptionId,
      expect.objectContaining({
        status: PrescriptionStatus.FAILED,
        errorMessage: 'Prescription processing failed',
      }),
    );
  });

  function createFile(mimeType = 'application/pdf'): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'prescription.pdf',
      encoding: '7bit',
      mimetype: mimeType,
      size: 100,
      buffer: Buffer.from('mock'),
      destination: '',
      filename: '',
      path: '',
      stream: undefined as never,
    };
  }
});
