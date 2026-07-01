import { PickType } from '@nestjs/swagger';
import { AdherenceQueryDto } from './adherence-query.dto';

export class AdherenceStatsQueryDto extends PickType(AdherenceQueryDto, [
  'medicationId',
  'from',
  'to',
] as const) {}
