import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RestablecerPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  nueva_password: string;
}