import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamoDbModule } from '../database/dynamodb/dynamodb.module';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { DynamoDbMedicationRepository } from './repositories/dynamodb-medication.repository';
import { MEDICATION_REPOSITORY } from './repositories/medication.repository';
import { IsEndDateAfterStartDateConstraint } from './validators/is-end-date-after-start-date.validator';

@Module({
  imports: [
    DynamoDbModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [MedicationsController],
  providers: [
    MedicationsService,
    JwtAuthGuard,
    IsEndDateAfterStartDateConstraint,
    {
      provide: MEDICATION_REPOSITORY,
      useClass: DynamoDbMedicationRepository,
    },
  ],
  exports: [MedicationsService],
})
export class MedicationsModule {}
