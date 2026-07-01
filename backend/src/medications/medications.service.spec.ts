jest.mock('uuid', () => ({
  v7: jest.fn(() => '01972e26-4d7a-7f47-a38e-04dd8a0fb731'),
}));

import { MedicationFrequency } from './enums/medication-frequency.enum';
import { InvalidMedicationScheduleException } from './exceptions/invalid-medication-schedule.exception';
import { MedicationNotFoundException } from './exceptions/medication-not-found.exception';
import { Medication } from './medication.interface';
import { MedicationsService } from './medications.service';
import type { MedicationRepository } from './repositories/medication.repository';

describe('MedicationsService', () => {
  const userId = '01972e10-49bb-73d4-a8d3-01cc389342f2';
  const medicationId = '01972e26-4d7a-7f47-a38e-04dd8a0fb731';
  const medication: Medication = {
    medicationId,
    userId,
    name: 'Vitamin D',
    dosage: '500mg',
    frequency: MedicationFrequency.DAILY,
    times: ['08:00'],
    startDate: 1782400000000,
    endDate: 1785000000000,
    instructions: 'Take after breakfast',
    isActive: true,
    createdAt: 1782000000000,
    updatedAt: 1782000000000,
  };
  let repository: jest.Mocked<MedicationRepository>;
  let service: MedicationsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new MedicationsService(repository);
  });

  it('uses the authenticated user ID when creating medication', async () => {
    repository.create.mockResolvedValue(medication);

    await service.create(userId, {
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      times: medication.times,
      startDate: medication.startDate,
      endDate: medication.endDate,
      instructions: medication.instructions,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        isActive: true,
        medicationId: expect.any(String),
      }),
    );
  });

  it('scopes medication lookup to the authenticated user', async () => {
    repository.findById.mockResolvedValue(medication);

    await service.findOne(userId, medicationId);

    expect(repository.findById).toHaveBeenCalledWith(userId, medicationId);
  });

  it('rejects an end date that is not after the start date', async () => {
    await expect(
      service.create(userId, {
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        times: medication.times,
        startDate: medication.startDate,
        endDate: medication.startDate,
      }),
    ).rejects.toBeInstanceOf(InvalidMedicationScheduleException);
  });

  it('returns not found when an owned medication does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(userId, medicationId)).rejects.toBeInstanceOf(
      MedicationNotFoundException,
    );
  });

  it('hard deletes using both owner and medication IDs', async () => {
    repository.delete.mockResolvedValue(true);

    await expect(service.remove(userId, medicationId)).resolves.toEqual({
      message: 'Medication deleted successfully',
    });
    expect(repository.delete).toHaveBeenCalledWith(userId, medicationId);
  });
});
