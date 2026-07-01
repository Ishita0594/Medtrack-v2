import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamoDbModule } from '../database/dynamodb/dynamodb.module';
import { MedicationsModule } from '../medications/medications.module';
import { AdherenceController } from './adherence.controller';
import { AdherenceService } from './adherence.service';
import { ADHERENCE_REPOSITORY } from './repositories/adherence.repository';
import { DynamoDbAdherenceRepository } from './repositories/dynamodb-adherence.repository';

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
  controllers: [AdherenceController],
  providers: [
    AdherenceService,
    JwtAuthGuard,
    {
      provide: ADHERENCE_REPOSITORY,
      useClass: DynamoDbAdherenceRepository,
    },
  ],
  exports: [AdherenceService],
})
export class AdherenceModule {}
