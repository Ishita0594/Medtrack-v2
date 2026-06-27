import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserResponseDto } from './dto/delete-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { USER_REPOSITORY } from './repositories/user.repository';
import type { UserRepository } from './repositories/user.repository';
import { UserAlreadyExistsException } from './exceptions/user-already-exists.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { USER_MESSAGES } from './users.constants';
import { UserMapper } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    const user = await this.userRepository.create({
      userId: this.generateUserId(),
      ...createUserDto,
    });

    return UserMapper.toResponse(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.list();

    return UserMapper.toResponseList(users);
  }

  async findOne(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    return UserMapper.toResponse(user);
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new UserNotFoundException();
    }

    if (
      updateUserDto.email &&
      updateUserDto.email.toLowerCase() !== existingUser.email
    ) {
      const userWithEmail = await this.userRepository.findByEmail(
        updateUserDto.email,
      );

      if (userWithEmail) {
        throw new UserAlreadyExistsException();
      }
    }

    const updatedUser = await this.userRepository.update(userId, updateUserDto);

    if (!updatedUser) {
      throw new UserNotFoundException();
    }

    return UserMapper.toResponse(updatedUser);
  }

  async remove(userId: string): Promise<DeleteUserResponseDto> {
    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new UserNotFoundException();
    }

    await this.userRepository.delete(userId);

    return {
      message: USER_MESSAGES.deleted,
    };
  }

  private generateUserId(): string {
    return uuidv7();
  }
}
