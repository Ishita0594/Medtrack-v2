import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AdherenceResponseDto } from '../adherence/dto/adherence-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicationResponseDto } from '../medications/dto/medication-response.dto';
import { CaregiversService } from './caregivers.service';
import { CaregiverQueryDto } from './dto/caregiver-query.dto';
import { CaregiverResponseDto } from './dto/caregiver-response.dto';
import { CreateCaregiverInviteDto } from './dto/create-caregiver-invite.dto';
import { UpdateCaregiverRelationshipDto } from './dto/update-caregiver-relationship.dto';
import { CaregiverRelationshipStatus } from './enums/caregiver-relationship-status.enum';
import { CaregiverRelationshipType } from './enums/caregiver-relationship-type.enum';

@ApiTags('caregivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Invite a caregiver as the authenticated patient' })
  @ApiCreatedResponse({
    description: 'Caregiver invitation created',
    type: CaregiverResponseDto,
  })
  @ApiConflictResponse({ description: 'Pending invitation already exists' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  invite(@Req() request: Request, @Body() input: CreateCaregiverInviteDto) {
    return this.caregiversService.invite(
      request.user!.sub,
      request.user!.role,
      input,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List caregiver relationships owned by a patient' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CaregiverRelationshipStatus,
  })
  @ApiQuery({
    name: 'relationshipType',
    required: false,
    enum: CaregiverRelationshipType,
  })
  @ApiOkResponse({
    description: 'Caregiver relationships retrieved',
    type: CaregiverResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findAll(@Req() request: Request, @Query() query: CaregiverQueryDto) {
    return this.caregiversService.findAll(
      request.user!.sub,
      request.user!.role,
      query,
    );
  }

  @Get('invitations')
  @ApiOperation({
    summary: 'List pending invitations for the authenticated caregiver email',
  })
  @ApiOkResponse({
    description: 'Pending caregiver invitations retrieved',
    type: CaregiverResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Caregiver role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findInvitations(@Req() request: Request) {
    return this.caregiversService.findInvitations(
      request.user!.email,
      request.user!.role,
    );
  }

  @Get('patients')
  @ApiOperation({ summary: 'List accepted patients for a caregiver' })
  @ApiOkResponse({
    description: 'Accepted patient relationships retrieved',
    type: CaregiverResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Caregiver role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findPatients(@Req() request: Request) {
    return this.caregiversService.findPatients(
      request.user!.sub,
      request.user!.role,
    );
  }

  @Get('patients/:patientId/medications')
  @ApiOperation({
    summary: 'List medications for a patient with an accepted relationship',
  })
  @ApiParam({ name: 'patientId', description: 'Connected patient ID' })
  @ApiOkResponse({
    description: 'Patient medications retrieved',
    type: MedicationResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Accepted relationship required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findPatientMedications(
    @Req() request: Request,
    @Param('patientId') patientId: string,
  ) {
    return this.caregiversService.findPatientMedications(
      request.user!.sub,
      request.user!.role,
      patientId,
    );
  }

  @Get('patients/:patientId/adherence')
  @ApiOperation({
    summary: 'List adherence for a patient with an accepted relationship',
  })
  @ApiParam({ name: 'patientId', description: 'Connected patient ID' })
  @ApiOkResponse({
    description: 'Patient adherence records retrieved',
    type: AdherenceResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Accepted relationship required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findPatientAdherence(
    @Req() request: Request,
    @Param('patientId') patientId: string,
  ) {
    return this.caregiversService.findPatientAdherence(
      request.user!.sub,
      request.user!.role,
      patientId,
    );
  }

  @Get(':relationshipId')
  @ApiOperation({ summary: 'Get a caregiver relationship owned by a patient' })
  @ApiParam({ name: 'relationshipId', description: 'UUIDv7 relationship ID' })
  @ApiOkResponse({
    description: 'Caregiver relationship retrieved',
    type: CaregiverResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Caregiver relationship not found' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findOne(
    @Req() request: Request,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.caregiversService.findOne(
      request.user!.sub,
      request.user!.role,
      relationshipId,
    );
  }

  @Patch(':relationshipId')
  @ApiOperation({ summary: 'Update a caregiver relationship as the patient' })
  @ApiParam({ name: 'relationshipId', description: 'UUIDv7 relationship ID' })
  @ApiOkResponse({
    description: 'Caregiver relationship updated',
    type: CaregiverResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Caregiver relationship not found' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  update(
    @Req() request: Request,
    @Param('relationshipId') relationshipId: string,
    @Body() input: UpdateCaregiverRelationshipDto,
  ) {
    return this.caregiversService.update(
      request.user!.sub,
      request.user!.role,
      relationshipId,
      input,
    );
  }

  @Post(':relationshipId/accept')
  @ApiOperation({ summary: 'Accept an invitation as its intended caregiver' })
  @ApiParam({ name: 'relationshipId', description: 'UUIDv7 relationship ID' })
  @ApiOkResponse({
    description: 'Caregiver invitation accepted',
    type: CaregiverResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiForbiddenResponse({ description: 'Invitation email or role mismatch' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  accept(
    @Req() request: Request,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.caregiversService.accept(
      request.user!.sub,
      request.user!.email,
      request.user!.role,
      relationshipId,
    );
  }

  @Post(':relationshipId/reject')
  @ApiOperation({ summary: 'Reject an invitation as its intended caregiver' })
  @ApiParam({ name: 'relationshipId', description: 'UUIDv7 relationship ID' })
  @ApiOkResponse({
    description: 'Caregiver invitation rejected',
    type: CaregiverResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiForbiddenResponse({ description: 'Invitation email or role mismatch' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  reject(
    @Req() request: Request,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.caregiversService.reject(
      request.user!.email,
      request.user!.role,
      relationshipId,
    );
  }

  @Post(':relationshipId/cancel')
  @ApiOperation({ summary: 'Cancel a pending invitation as its patient' })
  @ApiParam({ name: 'relationshipId', description: 'UUIDv7 relationship ID' })
  @ApiOkResponse({
    description: 'Caregiver invitation cancelled',
    type: CaregiverResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiNotFoundResponse({ description: 'Caregiver relationship not found' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  cancel(
    @Req() request: Request,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.caregiversService.cancel(
      request.user!.sub,
      request.user!.role,
      relationshipId,
    );
  }

  @Delete(':relationshipId')
  @ApiOperation({ summary: 'Permanently delete a patient-owned relationship' })
  @ApiParam({ name: 'relationshipId', description: 'UUIDv7 relationship ID' })
  @ApiOkResponse({
    description: 'Caregiver relationship deleted',
    schema: {
      example: { message: 'Caregiver relationship deleted successfully' },
    },
  })
  @ApiNotFoundResponse({ description: 'Caregiver relationship not found' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  remove(
    @Req() request: Request,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.caregiversService.remove(
      request.user!.sub,
      request.user!.role,
      relationshipId,
    );
  }
}
