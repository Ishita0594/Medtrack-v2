import { Inject, Injectable, Logger } from '@nestjs/common';
import { basename } from 'path';
import { v7 as uuidv7 } from 'uuid';
import { MedicationsService } from '../medications/medications.service';
import { PrescriptionQueryDto } from './dto/prescription-query.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { ProcessPrescriptionResponseDto } from './dto/process-prescription-response.dto';
import { PrescriptionFileType } from './enums/prescription-file-type.enum';
import { PrescriptionStatus } from './enums/prescription-status.enum';
import { InvalidPrescriptionFileException } from './exceptions/invalid-prescription-file.exception';
import { PrescriptionNotFoundException } from './exceptions/prescription-not-found.exception';
import { PrescriptionProcessingException } from './exceptions/prescription-processing.exception';
import { OCR_PROVIDER } from './ocr/ocr-provider.interface';
import type { OcrProvider } from './ocr/ocr-provider.interface';
import { PRESCRIPTION_AI_PARSER } from './ai/prescription-ai-parser.interface';
import type { PrescriptionAiParser } from './ai/prescription-ai-parser.interface';
import { ParsedMedication } from './parsed-medication.interface';
import { PrescriptionMapper } from './prescription.mapper';
import { PrescriptionUpload } from './prescription-upload.interface';
import { PRESCRIPTION_REPOSITORY } from './repositories/prescription.repository';
import type { PrescriptionRepository } from './repositories/prescription.repository';
import { PRESCRIPTION_STORAGE } from './storage/prescription-storage.interface';
import type { PrescriptionStorage } from './storage/prescription-storage.interface';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: PrescriptionRepository,
    @Inject(PRESCRIPTION_STORAGE)
    private readonly prescriptionStorage: PrescriptionStorage,
    @Inject(OCR_PROVIDER)
    private readonly ocrProvider: OcrProvider,
    @Inject(PRESCRIPTION_AI_PARSER)
    private readonly aiParser: PrescriptionAiParser,
    private readonly medicationsService: MedicationsService,
  ) {}

  async upload(
    userId: string,
    file?: Express.Multer.File,
  ): Promise<PrescriptionResponseDto> {
    this.validateFile(file);
    const validFile = file as Express.Multer.File;
    const prescriptionId = uuidv7();
    const storedFile = await this.prescriptionStorage.store(
      userId,
      prescriptionId,
      validFile,
    );

    try {
      const prescription = await this.prescriptionRepository.create({
        prescriptionId,
        userId,
        originalFileName: basename(validFile.originalname).slice(0, 255),
        fileType: this.resolveFileType(validFile.mimetype),
        mimeType: validFile.mimetype,
        fileSize: validFile.size,
        storageProvider: storedFile.storageProvider,
        storageKey: storedFile.storageKey,
        fileUrl: storedFile.fileUrl,
        status: PrescriptionStatus.UPLOADED,
      });

      return PrescriptionMapper.toResponse(prescription);
    } catch (error) {
      await this.prescriptionStorage.delete(storedFile.storageKey);
      throw error;
    }
  }

  async findAll(
    userId: string,
    query: PrescriptionQueryDto,
  ): Promise<PrescriptionResponseDto[]> {
    const prescriptions =
      await this.prescriptionRepository.findAllByUserId(userId);
    const filtered = query.status
      ? prescriptions.filter(
          (prescription) => prescription.status === query.status,
        )
      : prescriptions;

    return PrescriptionMapper.toResponseList(filtered);
  }

  async findOne(
    userId: string,
    prescriptionId: string,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.getOwnedPrescription(
      userId,
      prescriptionId,
    );

    return PrescriptionMapper.toResponse(prescription);
  }

  async getText(
    userId: string,
    prescriptionId: string,
  ): Promise<{ prescriptionId: string; ocrText: string }> {
    const prescription = await this.getOwnedPrescription(
      userId,
      prescriptionId,
    );

    return {
      prescriptionId,
      ocrText: prescription.ocrText ?? '',
    };
  }

  async getMedications(
    userId: string,
    prescriptionId: string,
  ): Promise<{ prescriptionId: string; medications: ParsedMedication[] }> {
    const prescription = await this.getOwnedPrescription(
      userId,
      prescriptionId,
    );

    return {
      prescriptionId,
      medications: prescription.aiParsedMedications ?? [],
    };
  }

  process(
    userId: string,
    prescriptionId: string,
  ): Promise<ProcessPrescriptionResponseDto> {
    return this.processPrescription(userId, prescriptionId, false);
  }

  reprocess(
    userId: string,
    prescriptionId: string,
  ): Promise<ProcessPrescriptionResponseDto> {
    return this.processPrescription(userId, prescriptionId, true);
  }

  async remove(
    userId: string,
    prescriptionId: string,
  ): Promise<{ message: string }> {
    const prescription = await this.getOwnedPrescription(
      userId,
      prescriptionId,
    );
    const deleted = await this.prescriptionRepository.delete(
      userId,
      prescriptionId,
    );

    if (!deleted) {
      throw new PrescriptionNotFoundException();
    }

    try {
      await this.prescriptionStorage.delete(prescription.storageKey);
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      this.logger.warn(
        `Prescription file cleanup failed for ${prescriptionId}: ${errorName}`,
      );
    }

    return { message: 'Prescription deleted successfully' };
  }

  private async processPrescription(
    userId: string,
    prescriptionId: string,
    forceOcr: boolean,
  ): Promise<ProcessPrescriptionResponseDto> {
    const existing = await this.getOwnedPrescription(userId, prescriptionId);

    if (
      !forceOcr &&
      existing.status === PrescriptionStatus.PROCESSED &&
      existing.createdMedicationIds?.length
    ) {
      return PrescriptionMapper.toProcessResponse(existing);
    }

    if (existing.status === PrescriptionStatus.PROCESSING) {
      throw new PrescriptionProcessingException();
    }

    const processing = await this.prescriptionRepository.update(
      userId,
      prescriptionId,
      {
        status: PrescriptionStatus.PROCESSING,
        expectedStatus: existing.status,
        clearErrorMessage: true,
      },
    );

    if (!processing) {
      throw new PrescriptionProcessingException();
    }

    let createdMedicationIds = [...(existing.createdMedicationIds ?? [])];

    try {
      const ocrText = await this.ocrProvider.extractText(processing);
      const parsedMedications = await this.aiParser.parse(ocrText);
      const medicationStartDate = Date.now();

      for (
        let index = createdMedicationIds.length;
        index < parsedMedications.length;
        index += 1
      ) {
        const parsed = parsedMedications[index];
        this.validateParsedMedication(parsed);
        const medicationInput = {
          name: parsed.name,
          dosage: parsed.dosage,
          frequency: parsed.frequency,
          times: parsed.times,
          startDate: medicationStartDate,
          instructions: parsed.instructions,
          ...(parsed.durationDays
            ? {
                endDate:
                  medicationStartDate +
                  parsed.durationDays * DAY_IN_MILLISECONDS,
              }
            : {}),
        };
        const medication = await this.medicationsService.create(
          userId,
          medicationInput,
        );
        createdMedicationIds.push(medication.medicationId);

        const progress = await this.prescriptionRepository.update(
          userId,
          prescriptionId,
          {
            createdMedicationIds: [...createdMedicationIds],
            expectedStatus: PrescriptionStatus.PROCESSING,
          },
        );

        if (!progress) {
          throw new PrescriptionProcessingException();
        }
      }

      // TODO: Optionally create reminders for generated medications.
      const processedAt = Date.now();
      const processed = await this.prescriptionRepository.update(
        userId,
        prescriptionId,
        {
          status: PrescriptionStatus.PROCESSED,
          ocrText,
          aiParsedMedications: parsedMedications,
          createdMedicationIds,
          processedAt,
          clearErrorMessage: true,
          expectedStatus: PrescriptionStatus.PROCESSING,
        },
      );

      if (!processed) {
        throw new PrescriptionProcessingException();
      }

      return PrescriptionMapper.toProcessResponse(processed);
    } catch (error) {
      await this.prescriptionRepository.update(userId, prescriptionId, {
        status: PrescriptionStatus.FAILED,
        errorMessage: 'Prescription processing failed',
        createdMedicationIds: [...createdMedicationIds],
        expectedStatus: PrescriptionStatus.PROCESSING,
      });
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(
        `Prescription processing failed for ${prescriptionId}: ${errorName}`,
      );
      throw new PrescriptionProcessingException();
    }
  }

  private async getOwnedPrescription(
    userId: string,
    prescriptionId: string,
  ): Promise<PrescriptionUpload> {
    const prescription = await this.prescriptionRepository.findById(
      userId,
      prescriptionId,
    );

    if (!prescription) {
      throw new PrescriptionNotFoundException();
    }

    return prescription;
  }

  private validateFile(
    file?: Express.Multer.File,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new InvalidPrescriptionFileException();
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new InvalidPrescriptionFileException(
        'Only JPEG, PNG, WebP, and PDF prescriptions are allowed',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new InvalidPrescriptionFileException(
        'Prescription file must not exceed 5MB',
      );
    }
  }

  private resolveFileType(mimeType: string): PrescriptionFileType {
    return mimeType === 'application/pdf'
      ? PrescriptionFileType.PDF
      : PrescriptionFileType.IMAGE;
  }

  private validateParsedMedication(medication: ParsedMedication): void {
    if (
      !medication.name.trim() ||
      !medication.dosage.trim() ||
      medication.times.length === 0 ||
      medication.times.some(
        (time) => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time),
      ) ||
      (medication.durationDays !== undefined &&
        (!Number.isInteger(medication.durationDays) ||
          medication.durationDays <= 0))
    ) {
      throw new PrescriptionProcessingException();
    }
  }
}
