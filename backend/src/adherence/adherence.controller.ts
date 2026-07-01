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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdherenceService } from './adherence.service';
import { AdherenceQueryDto } from './dto/adherence-query.dto';
import { AdherenceResponseDto } from './dto/adherence-response.dto';
import { AdherenceStatsQueryDto } from './dto/adherence-stats-query.dto';
import { AdherenceStatsResponseDto } from './dto/adherence-stats-response.dto';
import { CreateAdherenceRecordDto } from './dto/create-adherence-record.dto';
import { UpdateAdherenceRecordDto } from './dto/update-adherence-record.dto';
import { AdherenceStatus } from './enums/adherence-status.enum';

@ApiTags('adherence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('adherence')
export class AdherenceController {
  constructor(private readonly adherenceService: AdherenceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an adherence record for an owned medication',
  })
  @ApiCreatedResponse({
    description: 'Adherence record created successfully',
    type: AdherenceResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid adherence data' })
  @ApiNotFoundResponse({ description: 'Medication not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  create(@Req() request: Request, @Body() input: CreateAdherenceRecordDto) {
    return this.adherenceService.create(request.user!.sub, input);
  }

  @Get()
  @ApiOperation({
    summary: 'List adherence records for the authenticated user',
  })
  @ApiQuery({ name: 'medicationId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AdherenceStatus })
  @ApiQuery({ name: 'from', required: false, type: Number })
  @ApiQuery({ name: 'to', required: false, type: Number })
  @ApiOkResponse({
    description: 'Adherence records retrieved successfully',
    type: AdherenceResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid query range' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findAll(@Req() request: Request, @Query() query: AdherenceQueryDto) {
    return this.adherenceService.findAll(request.user!.sub, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Calculate adherence statistics' })
  @ApiQuery({ name: 'medicationId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: Number })
  @ApiQuery({ name: 'to', required: false, type: Number })
  @ApiOkResponse({
    description: 'Adherence statistics calculated successfully',
    type: AdherenceStatsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid query range' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  getStats(@Req() request: Request, @Query() query: AdherenceStatsQueryDto) {
    return this.adherenceService.getStats(request.user!.sub, query);
  }

  @Get(':recordId')
  @ApiOperation({ summary: 'Get one owned adherence record' })
  @ApiParam({ name: 'recordId', description: 'UUIDv7 adherence record ID' })
  @ApiOkResponse({
    description: 'Adherence record retrieved successfully',
    type: AdherenceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Adherence record not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findOne(@Req() request: Request, @Param('recordId') recordId: string) {
    return this.adherenceService.findOne(request.user!.sub, recordId);
  }

  @Patch(':recordId')
  @ApiOperation({ summary: 'Update an owned adherence record' })
  @ApiParam({ name: 'recordId', description: 'UUIDv7 adherence record ID' })
  @ApiOkResponse({
    description: 'Adherence record updated successfully',
    type: AdherenceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Adherence record not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  update(
    @Req() request: Request,
    @Param('recordId') recordId: string,
    @Body() input: UpdateAdherenceRecordDto,
  ) {
    return this.adherenceService.update(request.user!.sub, recordId, input);
  }

  @Delete(':recordId')
  @ApiOperation({ summary: 'Permanently delete an owned adherence record' })
  @ApiParam({ name: 'recordId', description: 'UUIDv7 adherence record ID' })
  @ApiOkResponse({
    description: 'Adherence record deleted successfully',
    schema: {
      example: { message: 'Adherence record deleted successfully' },
    },
  })
  @ApiNotFoundResponse({ description: 'Adherence record not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  remove(@Req() request: Request, @Param('recordId') recordId: string) {
    return this.adherenceService.remove(request.user!.sub, recordId);
  }
}
