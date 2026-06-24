import { Injectable } from '@nestjs/common';

@Injectable()
export class AdherenceService {
  getStatus() {
    return {
      module: 'adherence',
      status: 'ready',
    };
  }
}
