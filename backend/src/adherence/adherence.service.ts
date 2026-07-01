import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { MedicationsService } from '../medications/medications.service';
import { AdherenceRecord } from './adherence.interface';
import { AdherenceMapper } from './adherence.mapper';
import { AdherenceQueryDto } from './dto/adherence-query.dto';
import { AdherenceResponseDto } from './dto/adherence-response.dto';
import { AdherenceStatsQueryDto } from './dto/adherence-stats-query.dto';
import { AdherenceStatsResponseDto } from './dto/adherence-stats-response.dto';
import { CreateAdherenceRecordDto } from './dto/create-adherence-record.dto';
import { UpdateAdherenceRecordDto } from './dto/update-adherence-record.dto';
import { AdherenceStatus } from './enums/adherence-status.enum';
import { AdherenceRecordNotFoundException } from './exceptions/adherence-record-not-found.exception';
import { ADHERENCE_REPOSITORY } from './repositories/adherence.repository';
import type {
  AdherenceRepository,
  UpdateAdherenceRecordInput,
} from './repositories/adherence.repository';

@Injectable()
export class AdherenceService {
  constructor(
    @Inject(ADHERENCE_REPOSITORY)
    private readonly adherenceRepository: AdherenceRepository,
    private readonly medicationsService: MedicationsService,
  ) {}

  async create(
    userId: string,
    input: CreateAdherenceRecordDto,
  ): Promise<AdherenceResponseDto> {
    await this.medicationsService.findOne(userId, input.medicationId);
    const dateKey = this.toDateKey(input.scheduledAt);
    const record = await this.adherenceRepository.create({
      recordId: uuidv7(),
      userId,
      medicationId: input.medicationId,
      scheduledAt: input.scheduledAt,
      takenAt: input.takenAt ?? undefined,
      status: input.status,
      notes: input.notes,
      dateKey,
    });

    return AdherenceMapper.toResponse(record);
  }

  async findAll(
    userId: string,
    query: AdherenceQueryDto,
  ): Promise<AdherenceResponseDto[]> {
    this.validateDateRange(query.from, query.to);
    const records = await this.getFilteredRecords(userId, query);

    return AdherenceMapper.toResponseList(records);
  }

  async findOne(
    userId: string,
    recordId: string,
  ): Promise<AdherenceResponseDto> {
    const record = await this.adherenceRepository.findById(userId, recordId);

    if (!record) {
      throw new AdherenceRecordNotFoundException();
    }

    return AdherenceMapper.toResponse(record);
  }

  async update(
    userId: string,
    recordId: string,
    input: UpdateAdherenceRecordDto,
  ): Promise<AdherenceResponseDto> {
    const existing = await this.adherenceRepository.findById(userId, recordId);

    if (!existing) {
      throw new AdherenceRecordNotFoundException();
    }

    const update = this.resolveUpdate(input);
    const updated = await this.adherenceRepository.update(
      userId,
      recordId,
      update,
    );

    if (!updated) {
      throw new AdherenceRecordNotFoundException();
    }

    return AdherenceMapper.toResponse(updated);
  }

  async remove(userId: string, recordId: string): Promise<{ message: string }> {
    const deleted = await this.adherenceRepository.delete(userId, recordId);

    if (!deleted) {
      throw new AdherenceRecordNotFoundException();
    }

    return { message: 'Adherence record deleted successfully' };
  }

  async getStats(
    userId: string,
    query: AdherenceStatsQueryDto,
  ): Promise<AdherenceStatsResponseDto> {
    this.validateDateRange(query.from, query.to);
    const records = await this.getFilteredRecords(userId, query);
    const takenCount = this.countStatus(records, AdherenceStatus.TAKEN);
    const missedCount = this.countStatus(records, AdherenceStatus.MISSED);
    const skippedCount = this.countStatus(records, AdherenceStatus.SKIPPED);
    const pendingCount = this.countStatus(records, AdherenceStatus.PENDING);
    const completedCount = takenCount + missedCount + skippedCount;
    const adherenceRate =
      completedCount === 0
        ? 0
        : Math.round((takenCount / completedCount) * 10000) / 100;

    return {
      totalRecords: records.length,
      takenCount,
      missedCount,
      skippedCount,
      pendingCount,
      adherenceRate,
    };
  }

  private async getFilteredRecords(
    userId: string,
    query: AdherenceQueryDto | AdherenceStatsQueryDto,
  ): Promise<AdherenceRecord[]> {
    const records = await this.adherenceRepository.findAllByUserId(userId);

    return records.filter((record) => {
      if (query.medicationId && record.medicationId !== query.medicationId) {
        return false;
      }

      if ('status' in query && query.status && record.status !== query.status) {
        return false;
      }

      if (query.from !== undefined && record.scheduledAt < query.from) {
        return false;
      }

      if (query.to !== undefined && record.scheduledAt > query.to) {
        return false;
      }

      return true;
    });
  }

  private resolveUpdate(
    input: UpdateAdherenceRecordDto,
  ): UpdateAdherenceRecordInput {
    const update: UpdateAdherenceRecordInput = {
      status: input.status,
      notes: input.notes,
    };

    if (input.takenAt !== undefined && input.takenAt !== null) {
      update.takenAt = input.takenAt;
    } else if (input.takenAt === null) {
      update.clearTakenAt = true;
    }

    if (input.status === AdherenceStatus.TAKEN && input.takenAt == null) {
      update.takenAt = Date.now();
      update.clearTakenAt = false;
    } else if (
      input.status !== undefined &&
      input.status !== AdherenceStatus.TAKEN &&
      input.takenAt == null
    ) {
      update.clearTakenAt = true;
    }

    return update;
  }

  private countStatus(
    records: AdherenceRecord[],
    status: AdherenceStatus,
  ): number {
    return records.filter((record) => record.status === status).length;
  }

  private validateDateRange(from?: number, to?: number): void {
    if (from !== undefined && to !== undefined && from > to) {
      throw new BadRequestException('from must be less than or equal to to');
    }
  }

  private toDateKey(scheduledAt: number): string {
    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'scheduledAt must be valid epoch milliseconds',
      );
    }

    return date.toISOString().slice(0, 10);
  }
}
