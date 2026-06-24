import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MedicationsService } from './medications.service';

@ApiTags('medications')
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get('status')
  @ApiOkResponse({ description: 'Medications module status' })
  getStatus() {
    return this.medicationsService.getStatus();
  }
}
