import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'aarav.sharma@example.com',
    description: 'Registered email address',
  })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    example: 'StrongPass123!',
    minLength: 8,
    description: 'Account password',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
