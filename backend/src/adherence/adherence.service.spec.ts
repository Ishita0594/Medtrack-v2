jest.mock('uuid', () => ({
  v7: jest.fn(() => '01972e40-5978-74e6-b5b7-a5d2441796a8'),
}));

import { MedicationsService } from '../medications/medications.service';
import { AdherenceRecord } from './adherence.interface';
import { AdherenceService } from './adherence.service';
import { AdherenceStatus } from './enums/adherence-status.enum';
import { AdherenceRecordNotFoundException } from './exceptions/adherence-record-not-found.exception';
import type { AdherenceRepository } from './repositories/adherence.repository';

describe('AdherenceService', () => {
  const userId = '01972e10-49bb-73d4-a8d3-01cc389342f2';
  const medicationId = '01972e26-4d7a-7f47-a38e-04dd8a0fb731';
  const recordId = '01972e40-5978-74e6-b5b7-a5d2441796a8';
  const baseRecord: AdherenceRecord = {
    recordId,
    userId,
    medicationId,
    scheduledAt: 1782400000000,
    status: AdherenceStatus.PENDING,
    dateKey: '2026-06-25',
    createdAt: 1782000000000,
    updatedAt: 1782000000000,
  };
  let repository: jest.Mocked<AdherenceRepository>;
  let medicationsService: jest.Mocked<Pick<MedicationsService, 'findOne'>>;
  let service: AdherenceService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    medicationsService = {
      findOne: jest.fn(),
    };
    service = new AdherenceService(
      repository,
      medicationsService as unknown as MedicationsService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies medication ownership and derives dateKey on create', async () => {
    medicationsService.findOne.mockResolvedValue({} as never);
    repository.create.mockResolvedValue(baseRecord);

    await service.create(userId, {
      medicationId,
      scheduledAt: baseRecord.scheduledAt,
      status: AdherenceStatus.PENDING,
    });

    expect(medicationsService.findOne).toHaveBeenCalledWith(
      userId,
      medicationId,
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recordId,
        userId,
        medicationId,
        dateKey: '2026-06-25',
      }),
    );
  });

  it('sets takenAt when status changes to TAKEN', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1782400300000);
    repository.findById.mockResolvedValue(baseRecord);
    repository.update.mockResolvedValue({
      ...baseRecord,
      status: AdherenceStatus.TAKEN,
      takenAt: 1782400300000,
    });

    await service.update(userId, recordId, {
      status: AdherenceStatus.TAKEN,
    });

    expect(repository.update).toHaveBeenCalledWith(
      userId,
      recordId,
      expect.objectContaining({
        status: AdherenceStatus.TAKEN,
        takenAt: 1782400300000,
        clearTakenAt: false,
      }),
    );
  });

  it('clears takenAt when status changes away from TAKEN', async () => {
    repository.findById.mockResolvedValue({
      ...baseRecord,
      status: AdherenceStatus.TAKEN,
      takenAt: 1782400300000,
    });
    repository.update.mockResolvedValue({
      ...baseRecord,
      status: AdherenceStatus.MISSED,
    });

    await service.update(userId, recordId, {
      status: AdherenceStatus.MISSED,
    });

    expect(repository.update).toHaveBeenCalledWith(
      userId,
      recordId,
      expect.objectContaining({
        status: AdherenceStatus.MISSED,
        clearTakenAt: true,
      }),
    );
  });

  it('calculates adherence rate without pending records', async () => {
    repository.findAllByUserId.mockResolvedValue([
      { ...baseRecord, recordId: '1', status: AdherenceStatus.TAKEN },
      { ...baseRecord, recordId: '2', status: AdherenceStatus.TAKEN },
      { ...baseRecord, recordId: '3', status: AdherenceStatus.MISSED },
      { ...baseRecord, recordId: '4', status: AdherenceStatus.SKIPPED },
      { ...baseRecord, recordId: '5', status: AdherenceStatus.PENDING },
    ]);

    await expect(service.getStats(userId, {})).resolves.toEqual({
      totalRecords: 5,
      takenCount: 2,
      missedCount: 1,
      skippedCount: 1,
      pendingCount: 1,
      adherenceRate: 50,
    });
  });

  it('returns not found when deleting a missing record', async () => {
    repository.delete.mockResolvedValue(false);

    await expect(service.remove(userId, recordId)).rejects.toBeInstanceOf(
      AdherenceRecordNotFoundException,
    );
  });
});
