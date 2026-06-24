import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdherenceService } from './adherence.service';

@ApiTags('adherence')
@Controller('adherence')
export class AdherenceController {
  constructor(private readonly adherenceService: AdherenceService) {}

  @Get('status')
  @ApiOkResponse({ description: 'Adherence module status' })
  getStatus() {
    return this.adherenceService.getStatus();
  }
}
