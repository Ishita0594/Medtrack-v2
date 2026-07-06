import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'path';
import { PrescriptionStorageProvider } from '../enums/prescription-storage-provider.enum';
import {
  PrescriptionStorage,
  StoredPrescriptionFile,
} from './prescription-storage.interface';

@Injectable()
export class LocalPrescriptionStorageService implements PrescriptionStorage {
  private readonly baseDirectory: string;

  constructor(configService: ConfigService) {
    this.baseDirectory = resolve(
      process.cwd(),
      configService.getOrThrow<string>('prescriptions.uploadDir'),
    );
  }

  async store(
    userId: string,
    prescriptionId: string,
    file: Express.Multer.File,
  ): Promise<StoredPrescriptionFile> {
    const safeUserId = this.sanitizeSegment(userId);
    const safePrescriptionId = this.sanitizeSegment(prescriptionId);
    const safeFileName = this.sanitizeFileName(file.originalname);
    const storageKey = `${safeUserId}/${safePrescriptionId}/${safeFileName}`;
    const targetPath = this.resolveStorageKey(storageKey);

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, file.buffer, { flag: 'wx' });

    return {
      storageProvider: PrescriptionStorageProvider.LOCAL,
      storageKey,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const targetPath = this.resolveStorageKey(storageKey);

    try {
      await unlink(targetPath);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }

      throw error;
    }
  }

  private resolveStorageKey(storageKey: string): string {
    const targetPath = resolve(this.baseDirectory, ...storageKey.split('/'));
    const relativePath = relative(this.baseDirectory, targetPath);

    if (
      relativePath.startsWith('..') ||
      isAbsolute(relativePath) ||
      relativePath.length === 0
    ) {
      throw new Error('Invalid prescription storage key');
    }

    return targetPath;
  }

  private sanitizeSegment(value: string): string {
    const sanitized = value.replace(/[^A-Za-z0-9_-]/g, '_');

    if (!sanitized) {
      throw new Error('Invalid prescription storage segment');
    }

    return sanitized;
  }

  private sanitizeFileName(originalFileName: string): string {
    const sourceName = basename(originalFileName);
    const sanitized = sourceName.replace(/[^A-Za-z0-9._-]/g, '_');

    return sanitized || 'prescription';
  }
}
