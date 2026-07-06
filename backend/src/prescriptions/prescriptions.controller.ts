import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParsedMedicationDto } from './dto/parsed-medication.dto';
import { PrescriptionQueryDto } from './dto/prescription-query.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { ProcessPrescriptionResponseDto } from './dto/process-prescription-response.dto';
import { PrescriptionStatus } from './enums/prescription-status.enum';
import { InvalidPrescriptionFileException } from './exceptions/invalid-prescription-file.exception';
import { PrescriptionsService } from './prescriptions.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new InvalidPrescriptionFileException(
              'Only JPEG, PNG, WebP, and PDF prescriptions are allowed',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a prescription image or PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Prescription uploaded successfully',
    type: PrescriptionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid prescription file' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  upload(@Req() request: Request, @UploadedFile() file?: Express.Multer.File) {
    return this.prescriptionsService.upload(request.user!.sub, file);
  }

  @Get()
  @ApiOperation({ summary: 'List prescriptions for the authenticated user' })
  @ApiQuery({ name: 'status', required: false, enum: PrescriptionStatus })
  @ApiOkResponse({
    description: 'Prescriptions retrieved successfully',
    type: PrescriptionResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findAll(@Req() request: Request, @Query() query: PrescriptionQueryDto) {
    return this.prescriptionsService.findAll(request.user!.sub, query);
  }

  @Get(':prescriptionId/text')
  @ApiOperation({ summary: 'Get extracted OCR text' })
  @ApiParam({ name: 'prescriptionId', description: 'UUIDv7 prescription ID' })
  @ApiOkResponse({
    schema: {
      example: {
        prescriptionId: '01972ea0-e9bf-7707-bc34-f957a2aae522',
        ocrText: 'Tab Paracetamol 500mg twice daily...',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Prescription not found' })
  getText(
    @Req() request: Request,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.prescriptionsService.getText(request.user!.sub, prescriptionId);
  }

  @Get(':prescriptionId/medications')
  @ApiOperation({ summary: 'Get AI-parsed medications' })
  @ApiParam({ name: 'prescriptionId', description: 'UUIDv7 prescription ID' })
  @ApiOkResponse({
    schema: {
      properties: {
        prescriptionId: { type: 'string' },
        medications: {
          type: 'array',
          items: { $ref: '#/components/schemas/ParsedMedicationDto' },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Prescription not found' })
  getMedications(
    @Req() request: Request,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.prescriptionsService.getMedications(
      request.user!.sub,
      prescriptionId,
    );
  }

  @Get(':prescriptionId')
  @ApiOperation({ summary: 'Get prescription metadata and status' })
  @ApiParam({ name: 'prescriptionId', description: 'UUIDv7 prescription ID' })
  @ApiOkResponse({
    description: 'Prescription retrieved successfully',
    type: PrescriptionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Prescription not found' })
  findOne(
    @Req() request: Request,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.prescriptionsService.findOne(request.user!.sub, prescriptionId);
  }

  @Post(':prescriptionId/process')
  @ApiOperation({ summary: 'Run OCR, AI parsing, and medication creation' })
  @ApiParam({ name: 'prescriptionId', description: 'UUIDv7 prescription ID' })
  @ApiOkResponse({
    description: 'Prescription processed successfully',
    type: ProcessPrescriptionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Prescription not found' })
  @ApiUnprocessableEntityResponse({
    description: 'Prescription processing failed',
  })
  process(
    @Req() request: Request,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.prescriptionsService.process(request.user!.sub, prescriptionId);
  }

  @Post(':prescriptionId/reprocess')
  @ApiOperation({
    summary: 'Re-run OCR and AI parsing without duplicating medications',
  })
  @ApiParam({ name: 'prescriptionId', description: 'UUIDv7 prescription ID' })
  @ApiOkResponse({
    description: 'Prescription reprocessed successfully',
    type: ProcessPrescriptionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Prescription not found' })
  @ApiUnprocessableEntityResponse({
    description: 'Prescription processing failed',
  })
  reprocess(
    @Req() request: Request,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.prescriptionsService.reprocess(
      request.user!.sub,
      prescriptionId,
    );
  }

  @Delete(':prescriptionId')
  @ApiOperation({ summary: 'Delete prescription metadata and local file' })
  @ApiParam({ name: 'prescriptionId', description: 'UUIDv7 prescription ID' })
  @ApiOkResponse({
    schema: { example: { message: 'Prescription deleted successfully' } },
  })
  @ApiNotFoundResponse({ description: 'Prescription not found' })
  delete(
    @Req() request: Request,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.prescriptionsService.remove(request.user!.sub, prescriptionId);
  }
}
