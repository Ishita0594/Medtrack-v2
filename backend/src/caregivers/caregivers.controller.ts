import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CaregiversService } from './caregivers.service';

@ApiTags('caregivers')
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Get('status')
  @ApiOkResponse({ description: 'Caregivers module status' })
  getStatus() {
    return this.caregiversService.getStatus();
  }
}
