import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { MedicationResponseDto } from './dto/medication-response.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { InvalidMedicationScheduleException } from './exceptions/invalid-medication-schedule.exception';
import { MedicationNotFoundException } from './exceptions/medication-not-found.exception';
import { MedicationMapper } from './medication.mapper';
import { MEDICATION_REPOSITORY } from './repositories/medication.repository';
import type { MedicationRepository } from './repositories/medication.repository';

@Injectable()
export class MedicationsService {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly medicationRepository: MedicationRepository,
  ) {}

  async create(
    userId: string,
    input: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    this.validateSchedule(input.startDate, input.endDate);
    const medication = await this.medicationRepository.create({
      ...input,
      medicationId: uuidv7(),
      userId,
      isActive: true,
    });

    return MedicationMapper.toResponse(medication);
  }

  async findAll(userId: string): Promise<MedicationResponseDto[]> {
    const medications = await this.medicationRepository.findAllByUserId(userId);

    return MedicationMapper.toResponseList(medications);
  }

  async findOne(
    userId: string,
    medicationId: string,
  ): Promise<MedicationResponseDto> {
    const medication = await this.medicationRepository.findById(
      userId,
      medicationId,
    );

    if (!medication) {
      throw new MedicationNotFoundException();
    }

    return MedicationMapper.toResponse(medication);
  }

  async update(
    userId: string,
    medicationId: string,
    input: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    const existing = await this.medicationRepository.findById(
      userId,
      medicationId,
    );

    if (!existing) {
      throw new MedicationNotFoundException();
    }

    this.validateSchedule(
      input.startDate ?? existing.startDate,
      input.endDate ?? existing.endDate,
    );

    const updated = await this.medicationRepository.update(
      userId,
      medicationId,
      input,
    );

    if (!updated) {
      throw new MedicationNotFoundException();
    }

    return MedicationMapper.toResponse(updated);
  }

  async remove(
    userId: string,
    medicationId: string,
  ): Promise<{ message: string }> {
    const deleted = await this.medicationRepository.delete(
      userId,
      medicationId,
    );

    if (!deleted) {
      throw new MedicationNotFoundException();
    }

    return { message: 'Medication deleted successfully' };
  }

  private validateSchedule(startDate: number, endDate?: number): void {
    if (endDate !== undefined && endDate <= startDate) {
      throw new InvalidMedicationScheduleException();
    }
  }
}
