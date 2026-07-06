import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamoDbModule } from '../database/dynamodb/dynamodb.module';
import { MedicationsModule } from '../medications/medications.module';
import { MockPrescriptionAiParserService } from './ai/mock-prescription-ai-parser.service';
import { PRESCRIPTION_AI_PARSER } from './ai/prescription-ai-parser.interface';
import { MockOcrProviderService } from './ocr/mock-ocr-provider.service';
import { OCR_PROVIDER } from './ocr/ocr-provider.interface';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { DynamoDbPrescriptionRepository } from './repositories/dynamodb-prescription.repository';
import { PRESCRIPTION_REPOSITORY } from './repositories/prescription.repository';
import { LocalPrescriptionStorageService } from './storage/local-prescription-storage.service';
import { PRESCRIPTION_STORAGE } from './storage/prescription-storage.interface';

@Module({
  imports: [
    DynamoDbModule,
    MedicationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    JwtAuthGuard,
    {
      provide: PRESCRIPTION_REPOSITORY,
      useClass: DynamoDbPrescriptionRepository,
    },
    {
      provide: PRESCRIPTION_STORAGE,
      useClass: LocalPrescriptionStorageService,
    },
    {
      provide: OCR_PROVIDER,
      useClass: MockOcrProviderService,
    },
    {
      provide: PRESCRIPTION_AI_PARSER,
      useClass: MockPrescriptionAiParserService,
    },
  ],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
