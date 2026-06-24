import { Injectable } from '@nestjs/common';

@Injectable()
export class MedicationsService {
  getStatus() {
    return {
      module: 'medications',
      status: 'ready',
    };
  }
}
