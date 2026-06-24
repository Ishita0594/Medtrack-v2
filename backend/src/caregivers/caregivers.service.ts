import { Injectable } from '@nestjs/common';

@Injectable()
export class CaregiversService {
  getStatus() {
    return {
      module: 'caregivers',
      status: 'ready',
    };
  }
}
