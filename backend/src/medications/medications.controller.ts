import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { MedicationResponseDto } from './dto/medication-response.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { MedicationsService } from './medications.service';

@ApiTags('medications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a medication for the authenticated user' })
  @ApiCreatedResponse({
    description: 'Medication created successfully',
    type: MedicationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid medication schedule' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  create(@Req() request: Request, @Body() input: CreateMedicationDto) {
    return this.medicationsService.create(request.user!.sub, input);
  }

  @Get()
  @ApiOperation({ summary: 'List medications for the authenticated user' })
  @ApiOkResponse({
    description: 'Medications retrieved successfully',
    type: MedicationResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findAll(@Req() request: Request) {
    return this.medicationsService.findAll(request.user!.sub);
  }

  @Get(':medicationId')
  @ApiOperation({
    summary: 'Get one medication owned by the authenticated user',
  })
  @ApiParam({ name: 'medicationId', description: 'UUIDv7 medication ID' })
  @ApiOkResponse({
    description: 'Medication retrieved successfully',
    type: MedicationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Medication not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findOne(
    @Req() request: Request,
    @Param('medicationId') medicationId: string,
  ) {
    return this.medicationsService.findOne(request.user!.sub, medicationId);
  }

  @Patch(':medicationId')
  @ApiOperation({
    summary: 'Update a medication owned by the authenticated user',
  })
  @ApiParam({ name: 'medicationId', description: 'UUIDv7 medication ID' })
  @ApiOkResponse({
    description: 'Medication updated successfully',
    type: MedicationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid medication schedule' })
  @ApiNotFoundResponse({ description: 'Medication not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  update(
    @Req() request: Request,
    @Param('medicationId') medicationId: string,
    @Body() input: UpdateMedicationDto,
  ) {
    return this.medicationsService.update(
      request.user!.sub,
      medicationId,
      input,
    );
  }

  @Delete(':medicationId')
  @ApiOperation({ summary: 'Permanently delete an owned medication' })
  @ApiParam({ name: 'medicationId', description: 'UUIDv7 medication ID' })
  @ApiOkResponse({
    description: 'Medication deleted successfully',
    schema: {
      example: { message: 'Medication deleted successfully' },
    },
  })
  @ApiNotFoundResponse({ description: 'Medication not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  remove(@Req() request: Request, @Param('medicationId') medicationId: string) {
    return this.medicationsService.remove(request.user!.sub, medicationId);
  }
}
