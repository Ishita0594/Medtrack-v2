import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserResponseDto } from './dto/delete-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiConflictResponse({ description: 'Email is already registered' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List users',
    description: 'Requires a JWT bearer token.',
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: UserResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a user by ID',
    description: 'Requires a JWT bearer token.',
  })
  @ApiParam({
    name: 'userId',
    example: '018f6b90-5d7d-7c2a-bf2c-5c68d7d4b7f0',
  })
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a user',
    description: 'Requires a JWT bearer token.',
  })
  @ApiParam({
    name: 'userId',
    example: '018f6b90-5d7d-7c2a-bf2c-5c68d7d4b7f0',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email is already registered' })
  update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Requires a JWT bearer token.',
  })
  @ApiParam({
    name: 'userId',
    example: '018f6b90-5d7d-7c2a-bf2c-5c68d7d4b7f0',
  })
  @ApiOkResponse({
    description: 'User deleted successfully',
    type: DeleteUserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  delete(@Param('userId') userId: string) {
    return this.usersService.remove(userId);
  }
}
