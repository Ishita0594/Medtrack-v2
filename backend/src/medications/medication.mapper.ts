import { MedicationResponseDto } from './dto/medication-response.dto';
import { Medication } from './medication.interface';

export class MedicationMapper {
  static toResponse(medication: Medication): MedicationResponseDto {
    return {
      medicationId: medication.medicationId,
      userId: medication.userId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      times: medication.times,
      startDate: medication.startDate,
      endDate: medication.endDate,
      instructions: medication.instructions,
      isActive: medication.isActive,
      createdAt: medication.createdAt,
      updatedAt: medication.updatedAt,
    };
  }

  static toResponseList(medications: Medication[]): MedicationResponseDto[] {
    return medications.map((medication) => this.toResponse(medication));
  }
}
