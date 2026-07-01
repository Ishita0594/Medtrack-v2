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
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ReminderQueryDto } from './dto/reminder-query.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { SnoozeReminderDto } from './dto/snooze-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderStatus } from './enums/reminder-status.enum';
import { RemindersService } from './reminders.service';

@ApiTags('reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a reminder for an owned medication' })
  @ApiCreatedResponse({
    description: 'Reminder created successfully',
    type: ReminderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid reminder data' })
  @ApiNotFoundResponse({ description: 'Medication not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  create(@Req() request: Request, @Body() input: CreateReminderDto) {
    return this.remindersService.create(request.user!.sub, input);
  }

  @Get()
  @ApiOperation({ summary: 'List reminders for the authenticated user' })
  @ApiQuery({ name: 'medicationId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ReminderStatus })
  @ApiQuery({ name: 'from', required: false, type: Number })
  @ApiQuery({ name: 'to', required: false, type: Number })
  @ApiQuery({ name: 'dateKey', required: false, type: String })
  @ApiOkResponse({
    description: 'Reminders retrieved successfully',
    type: ReminderResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findAll(@Req() request: Request, @Query() query: ReminderQueryDto) {
    return this.remindersService.findAll(request.user!.sub, query);
  }

  @Get(':reminderId')
  @ApiOperation({ summary: 'Get one owned reminder' })
  @ApiParam({ name: 'reminderId', description: 'UUIDv7 reminder ID' })
  @ApiOkResponse({
    description: 'Reminder retrieved successfully',
    type: ReminderResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Reminder not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findOne(@Req() request: Request, @Param('reminderId') reminderId: string) {
    return this.remindersService.findOne(request.user!.sub, reminderId);
  }

  @Patch(':reminderId')
  @ApiOperation({ summary: 'Update an owned reminder' })
  @ApiParam({ name: 'reminderId', description: 'UUIDv7 reminder ID' })
  @ApiOkResponse({
    description: 'Reminder updated successfully',
    type: ReminderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiNotFoundResponse({ description: 'Reminder not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  update(
    @Req() request: Request,
    @Param('reminderId') reminderId: string,
    @Body() input: UpdateReminderDto,
  ) {
    return this.remindersService.update(request.user!.sub, reminderId, input);
  }

  @Post(':reminderId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an owned reminder' })
  @ApiParam({ name: 'reminderId', description: 'UUIDv7 reminder ID' })
  @ApiOkResponse({
    description: 'Reminder acknowledged successfully',
    type: ReminderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiNotFoundResponse({ description: 'Reminder not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  acknowledge(
    @Req() request: Request,
    @Param('reminderId') reminderId: string,
  ) {
    return this.remindersService.acknowledge(request.user!.sub, reminderId);
  }

  @Post(':reminderId/snooze')
  @ApiOperation({ summary: 'Snooze an owned reminder' })
  @ApiParam({ name: 'reminderId', description: 'UUIDv7 reminder ID' })
  @ApiOkResponse({
    description: 'Reminder snoozed successfully',
    type: ReminderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid snooze time or status transition',
  })
  @ApiNotFoundResponse({ description: 'Reminder not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  snooze(
    @Req() request: Request,
    @Param('reminderId') reminderId: string,
    @Body() input: SnoozeReminderDto,
  ) {
    return this.remindersService.snooze(request.user!.sub, reminderId, input);
  }

  @Post(':reminderId/mark-missed')
  @ApiOperation({ summary: 'Mark an owned reminder as missed' })
  @ApiParam({ name: 'reminderId', description: 'UUIDv7 reminder ID' })
  @ApiOkResponse({
    description: 'Reminder marked as missed',
    type: ReminderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiNotFoundResponse({ description: 'Reminder not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  markMissed(@Req() request: Request, @Param('reminderId') reminderId: string) {
    return this.remindersService.markMissed(request.user!.sub, reminderId);
  }

  @Delete(':reminderId')
  @ApiOperation({ summary: 'Permanently delete an owned reminder' })
  @ApiParam({ name: 'reminderId', description: 'UUIDv7 reminder ID' })
  @ApiOkResponse({
    description: 'Reminder deleted successfully',
    schema: { example: { message: 'Reminder deleted successfully' } },
  })
  @ApiNotFoundResponse({ description: 'Reminder not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  remove(@Req() request: Request, @Param('reminderId') reminderId: string) {
    return this.remindersService.remove(request.user!.sub, reminderId);
  }
}
