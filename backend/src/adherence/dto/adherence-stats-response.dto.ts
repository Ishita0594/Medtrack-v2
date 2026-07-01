import { ApiProperty } from '@nestjs/swagger';

export class AdherenceStatsResponseDto {
  @ApiProperty({ example: 10 })
  totalRecords: number;

  @ApiProperty({ example: 7 })
  takenCount: number;

  @ApiProperty({ example: 2 })
  missedCount: number;

  @ApiProperty({ example: 1 })
  skippedCount: number;

  @ApiProperty({ example: 0 })
  pendingCount: number;

  @ApiProperty({ example: 70 })
  adherenceRate: number;
}
