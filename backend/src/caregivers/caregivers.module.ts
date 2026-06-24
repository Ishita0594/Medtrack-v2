import { Module } from '@nestjs/common';
import { CaregiversController } from './caregivers.controller';
import { CaregiversService } from './caregivers.service';

@Module({
  controllers: [CaregiversController],
  providers: [CaregiversService],
  exports: [CaregiversService],
})
export class CaregiversModule {}
