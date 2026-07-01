import { AdherenceResponseDto } from './dto/adherence-response.dto';
import { AdherenceRecord } from './adherence.interface';

export class AdherenceMapper {
  static toResponse(record: AdherenceRecord): AdherenceResponseDto {
    return {
      recordId: record.recordId,
      userId: record.userId,
      medicationId: record.medicationId,
      scheduledAt: record.scheduledAt,
      takenAt: record.takenAt,
      status: record.status,
      notes: record.notes,
      dateKey: record.dateKey,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toResponseList(records: AdherenceRecord[]): AdherenceResponseDto[] {
    return records.map((record) => this.toResponse(record));
  }
}
