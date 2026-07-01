import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface MedicationSchedule {
  startDate?: number;
  endDate?: number;
}

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: number | undefined, args: ValidationArguments): boolean {
    if (endDate === undefined) {
      return true;
    }

    const { startDate } = args.object as MedicationSchedule;

    return startDate === undefined || endDate > startDate;
  }

  defaultMessage(): string {
    return 'endDate must be greater than startDate';
  }
}
